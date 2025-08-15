<script>
  import {
    highlightNeighborhoods,
    mapZoom,
    selectedAddressPoint,
    selectedData,
    selectedNeighborhoods,
  } from "../store/store";
  import { isNumeric } from "./utils";

  let searchString = "";
  let searchResults = [];
  let isSelected = true;

  function search() {
    searchResults = [];
    const str = searchString.trim();

    // if numeric look for NPA or zip
    if (isNumeric(str)) {
      // NPA
      const keys = Object.keys($selectedData.m);
      if (keys.indexOf(str) !== -1)
        searchResults = searchResults.concat({
          cat: "NPA",
          id: str,
          label: str,
        });

      // zipcode
      if (str.length === 5) {
        fetch(
          `https://maps.mecklenburgcountync.gov/dirt/api/v1/query/zipcodes?columns=gid as id, zip as label, 'ZIP' as cat&limit=10&filter=zip='${str}'`,
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error();
            }
            return response.json();
          })
          .then((json) => {
            searchResults = searchResults.concat(json);
          })
          .catch((error) => {
            console.error(
              "There has been a problem with your fetch operation:",
              error,
            );
          });
      }
    }

    // if string and larger than 4 chars
    if (!isNumeric(str) && str.length >= 4) {
      // Address
      const filter = encodeURIComponent(
        `ts @@ to_tsquery('addressing_en', '${
          str.toUpperCase().replace(/ /g, "&") + ":*"
        }')`,
      );
      fetch(
        `https://maps.mecklenburgcountync.gov/dirt/api/v1/query/master_address_table?columns=objectid as id, full_address as label, 'ADDRESS' as cat&limit=10&filter=${filter}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error();
          }
          return response.json();
        })
        .then((json) => {
          searchResults = searchResults.concat(json);
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error,
          );
        });

      // NSA
      fetch(
        `https://maps.mecklenburgcountync.gov/dirt/api/v1/query/neighborhood_statistical_areas?columns=gid as id, nsa_name as label, 'NSA' as cat&limit=10&filter=nsa_name%20ilike%20'${str}%25'`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error();
          }
          return response.json();
        })
        .then((json) => {
          searchResults = searchResults.concat(json);
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error,
          );
        });
    }
  }

  async function getAddressCoordinates(id) {
    await fetch(
      `https://maps.mecklenburgcountync.gov/dirt/api/v1/query/master_address_table?columns=round(ST_x(ST_transform(the_geom,4326))::NUMERIC,4) as lng,round(ST_y(ST_transform(the_geom,4326))::NUMERIC,4) as lat,round(ST_x(the_geom)::NUMERIC, 4) AS x,round(ST_y(the_geom)::NUMERIC, 4) AS y&filter=objectid=${id}`,
    )
      .then((response) => response.json())
      .then((json) => {
        if (json.length) {
          const { x, y, lng, lat } = json[0];

          selectedAddressPoint.set({
            x, // Map SRID (2264 gibi)
            y,
            lng, // WGS84 EPSG:4326
            lat,
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching address point:", error);
      });
  }

  function clearSelection() {
    // Clear existing highlight + address marker + selected neighborhoods
    highlightNeighborhoods.set([]);
    selectedNeighborhoods.set([]);
    selectedAddressPoint.set(null);
  }

  function selectAndHighlight(ids) {
    const unique_ids = [...new Set(ids)]; // Remove duplicate ids before proceed
    selectedNeighborhoods.set(unique_ids);
    highlightNeighborhoods.set(unique_ids);
    mapZoom.set(true);
  }

  function selectResults(cat, id) {
    const found = searchResults.find((r) => r.id === id && r.cat === cat);
    if (found) searchString = found.label || id;
    isSelected = true;
    console.log(found);

    if (cat === "NPA") {
      selectAndHighlight([""]); // Clear highlight if NPA
      selectedNeighborhoods.set([id]);
      mapZoom.set(true);
    }
    if (cat === "NSA") {
      fetch(
        `https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_feature/neighborhood_statistical_areas/neighborhoods?geom_column_from=the_geom&geom_column_to=the_geom&columns=neighborhoods.id&filter=neighborhood_statistical_areas.gid=${id}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error();
          }
          return response.json();
        })
        .then((json) => {
          // $selectedNeighborhoods = json.map((el) => el.id.toString());
          // $mapZoom = true;
          const ids = json.map((el) => el.id.toString());
          selectAndHighlight(ids);
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error,
          );
        });
    }
    if (cat === "ZIP") {
      fetch(
        `https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_feature/zipcodes/neighborhoods?geom_column_from=the_geom&geom_column_to=the_geom&columns=neighborhoods.id&filter=zipcodes.gid=${id}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error();
          }
          return response.json();
        })
        .then((json) => {
          // $selectedNeighborhoods = json.map((el) => el.id.toString());
          // $mapZoom = true;
          const ids = json.map((el) => el.id.toString());
          selectAndHighlight(ids);
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error,
          );
        });
    }
    if (cat === "ADDRESS") {
      // Get address point coordinates to mark on map
      getAddressCoordinates(`${id}`);

      fetch(
        `https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_feature/master_address_table/neighborhoods?geom_column_from=the_geom&geom_column_to=the_geom&columns=neighborhoods.id&filter=master_address_table.objectid=${id}`,
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error();
          }
          return response.json();
        })
        .then((json) => {
          // $selectedNeighborhoods = json.map((el) => el.id.toString());
          // $mapZoom = true;
          const ids = json.map((el) => el.id.toString());
          selectAndHighlight(ids);
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error,
          );
        });
    }
  }


  function clearSearch() {
    clearSelection();
    searchString = "";
    // searchResults = [];
    setTimeout(() => (searchResults = []), 250)
  }
  
  // Function to clear the search box and results when clicking inside the input area
  function handleInputClick() {
    if (!isSelected) {
      clearSearch();
    }
    isSelected = false;
  }
</script>

<div class="relative">
  <div class="mb-2">
    <input
      class="border-b-stone-200 border-b-2 w-full focus:border-b-pink-600"
      bind:value={searchString}
      on:input={search}
      on:focus={() => clearSearch()}
      on:blur={handleInputClick}
      placeholder="Search..."
      on:click={handleInputClick} 
    />
  </div>

  {#if searchResults.length > 0}
    <div
      class="absolute w-full bg-white overflow-y-auto overflow-x-hidden z-50"
      style="max-height: 200px;"
    >
      {#each searchResults as result}
        <!-- 
          Warning: A11y: <div> with click, keypress handlers must have an ARIA rolesvelte(a11y-no-static-element-interactions) 
          Added (12/12/2024): role="button" // Add this line to define the ARIA role
          Added (12/12/2024): tabindex="0" // Make the div focusable for keyboard interactions
        -->
        <div
          role="button"
          tabindex="0"
          class="cursor-pointer whitespace-nowrap text-sm rounded text-blue-700 py-2 px-1 hover:bg-blue-500 hover:text-white transition-colors"
          on:click={() => selectResults(result.cat, result.id)}
          on:keypress={() => selectResults(result.cat, result.id)}
        >
          <span class="bg-blue-500 text-white mr-2 p-1 font-semibold"
            >{result.cat.substring(0, 3)}</span
          >
          {result.label}
        </div>
      {/each}
    </div>
  {/if}

  <p class="text-sm text-stone-600">
    Enter a <span
      class="text-highlight hover:cursor-pointer"
      title="Neighborhood Profile Areas (NPAs) are geographic areas used for the organization and presentation of data in the Quality of Life Study. The boundaries were developed with community input and are based on one or more Census block groups."
    >
      NPA</span
    >, address, NSA or zip code.
  </p>
</div>

<style>
  input:focus {
    outline: none;
  }
</style>
