const inputBox = document.querySelector('.inputBox');
const searchBtn = document.querySelector('.searchBtn');
const outputBox = document.querySelector('.outputSection');
const inputContainer = document.querySelector('.inpSec');

// Cache for type data
const typeCache = {};

// Fetch type data with caching
async function getTypeDataCached(type) {
  if (typeCache[type]) return typeCache[type];
  const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
  const data = await response.json();
  typeCache[type] = data.damage_relations;
  return data.damage_relations;
}

// Capitalize first letter of a string
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Calculate weaknesses based on type data
function calculateWeaknesses(type1Data, type2Data = null) {
  const allTypes = new Set([
    ...type1Data.double_damage_from.map(t => t.name),
    ...(type2Data ? type2Data.double_damage_from.map(t => t.name) : [])
  ]);

  const weaknesses = [];
  for (const type of allTypes) {
    let multiplier = 1;

    // Double damage
    if (type1Data.double_damage_from.some(t => t.name === type)) multiplier *= 2;
    if (type2Data && type2Data.double_damage_from.some(t => t.name === type)) multiplier *= 2;

    // Half damage
    if (type1Data.half_damage_from.some(t => t.name === type)) multiplier *= 0.5;
    if (type2Data && type2Data.half_damage_from.some(t => t.name === type)) multiplier *= 0.5;

    // No damage
    if (
      type1Data.no_damage_from.some(t => t.name === type) ||
      (type2Data && type2Data.no_damage_from.some(t => t.name === type))
    ) multiplier = 0;

    if (multiplier >= 1) {
      weaknesses.push(`${capitalize(type)} (x${multiplier})`);
    }
  }

  return weaknesses;
}

// Event listener for search button
searchBtn.addEventListener('click', async () => {
  const value = inputBox.value.toLowerCase();
  const url = `https://pokeapi.co/api/v2/pokemon/${value}`;
  let data;

  try {
    const response = await fetch(url);
    data = await response.json();
  } catch (error) {
    console.log(error);
  }

  if (data) {
    // Fetch type data for the Pokémon
    const type1Data = await getTypeDataCached(data.types[0].type.name);
    const type2Data = data.types[1] ? await getTypeDataCached(data.types[1].type.name) : null;

    // Calculate weaknesses
    const weaknesses = calculateWeaknesses(type1Data, type2Data).join(', ');

    // Display Pokémon details
    outputBox.innerHTML = `
      <div class="pokemon">
        <div class="pokeImage">
          <img src="${data.sprites.front_default}" alt="">
          <img src="${data.sprites.front_shiny}" alt="">
        </div>
        <div>
          <h2>Name: ${capitalize(data.forms[0].name)}</h2>
          <h4>Type: ${data.types.map(t => capitalize(t.type.name)).join('/')}</h4>
        </div>
        <div>
          <p>Ability: ${data.abilities.map(a => capitalize(a.ability.name)).join(', ')}</p>
          <p>Height: ${(data.height / 3).toFixed(1)}</p>
          <p>Weight: ${(data.weight / 4.54).toFixed(2)} lbs.</p>
          <p>Weaknesses: ${weaknesses}</p>
        </div>
      </div>
    `;

    // Adjust UI
    inputContainer.style.top = "20%";
    outputBox.style.visibility = "visible";
  } else {
    inputContainer.style.top = "50%";
    outputBox.style.visibility = "hidden";
  }
});
