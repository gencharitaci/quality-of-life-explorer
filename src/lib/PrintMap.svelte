<script>
  import { printOptions } from "../store/print";
  import Map from "./Map.svelte";
  
</script>

<div
  class="relative shadow-md print:shadow-none page"
  class:hidden={!$printOptions.map}
>

  <!-- 
  Property 'flyto' is missing in type '{}' but required in type '{ flyto: any; interactive?: boolean; }'.
  <Map /> 

  Added: 
  flyto={{
    zoom: zoomLevel     // number, 
    center: [lng, lat], // center lngLat coordinates 
    pitch: 0            // number (https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/)
  }}
  interactive={true}    // boolean
  -->
  <Map flyto={{ pitch: 0 }} interactive={true}/>
</div>
 