import { ckmeans } from 'simple-statistics'
import { derived, readable, writable } from 'svelte/store'
import dataJSON from '../../data/data.json'
import geoStats from '../assets/geostats.json'
import { calcAggregate, calcRaw } from '../lib/utils'


// sort data JSON by category and title
dataJSON.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))


// This will control the number of breaks
const colorList = ["rgb(238,250,227)", "rgb(186,228,188)", "rgb(123,204,196)", "rgb(67,162,202)", "rgb(8,104,172)"]

// Browser navigation detector
let browserNav = false

// toggle help modal
export let help = writable(false)

// geojson extent
export const mapFullExtent = readable(geoStats.bounds)


// Set initial metric and selected sets
let metric = dataJSON[Math.floor(Math.random() * dataJSON.length)].metric
const [metricArg, neighborhoodsArg] = readHashArgs();
if (metricArg) metric = metricArg
let selected = neighborhoodsArg


// Adress point
export const selectedAddressPoint = writable(null);

// read URL hash args
/**
 * @returns {[string|null, string[]]}
 */
function readHashArgs() {
  const args = window.location.hash.replace('#', '').split('/');

  /** @type {string|null} */
  const metricArg = args[0] && dataJSON.some(el => el.metric === 'm' + args[0])
    ? 'm' + args[0]
    : null;

  /** @type {string[]} */
  const neighborhoodsArg = (args[1] || '').split(',').filter(r => geoStats.keys.includes(r));

  return [metricArg, neighborhoodsArg];
}


// readable data config
export const dataConfig = readable(dataJSON)

// data categories
export const dataCategories = derived(dataConfig, val => {
  return [...new Set(val.map(el => el.category))]
})

// what's new list
export const whatsnew = readable([
  "m11", "m19", "m30", "m34", "m35", "m4", "m41", "m42", "m43", "m5", "m53", "m6", "m68",
  "m69", "m7", "m71", "m72", "m76", "m8", "m83", "m9", "m89"
])


// the selected metric, either random or from url hash
export let selectedMetric = writable(metric)

// map zoom to selected toggle
export let mapZoom = writable(selected.length > 0 ? true : false)


// derived selected data config
export let selectedConfig = derived([dataConfig, selectedMetric], $values => {
  return $values[0].filter(el => el.metric === $values[1])[0]
})

// writable selected metric data
export let selectedData = writable(null)
selectedMetric.subscribe(value => {
  fetch(`./data/metric/${value}.json`)
    .then(response => response.json())
    .then(json => {
      selectedData.set(json)
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
    })
})

// breaks
export let breakCkmeans = derived(selectedData, value => {
  if (!value) return null
  let breakSet = []
  for (const key in value.m) {
    breakSet = breakSet.concat(value.m[key])
  }
  return ckmeans(breakSet.filter(el => el !== null), colorList.length)
})
export let breaks = derived(breakCkmeans, value => {
  if (!value) return null
  return value.map(el => Math.max(...el))
})
export let minBreak = derived(breakCkmeans, value => {
  if (!value) return null
  return Math.min(...value[0])
})


// year info
export let yearIdx = writable(null)
selectedData.subscribe(value => {
  if (!value) return null
  yearIdx.set(value.years.length - 1)
})

// selected NPA
export let selectedNeighborhoods = writable(selected)

// highlight NPA's
export let highlightNeighborhoods = writable([])

// colors
export const colors = readable(colorList)

// Aggregate county value
export let calcCounty = derived([selectedData, selectedConfig], ([data, config]) => {
  if (!data) return null
  return calcAggregate(data, config, true)
})

// Aggregate selected value
export let calcSelected = derived([selectedData, selectedNeighborhoods, selectedConfig], ([data, neighborhoods, config]) => {
  if (!data || neighborhoods.length === 0) return null
  return calcAggregate(data, config, false, neighborhoods)
})

// Aggregate selected value
export let calcSelectedRaw = derived([selectedData, selectedNeighborhoods, selectedConfig], ([data, neighborhoods, config]) => {
  if (!data || !config.raw_label || neighborhoods.length === 0) return null
  return calcRaw(data, config, false, neighborhoods)
})

// Aggregate selected value
export let calcCountyRaw = derived([selectedData, selectedConfig], ([data, config]) => {
  if (!data || !config.raw_label) return null
  return calcRaw(data, config, true)
})


const hash = derived([selectedMetric, selectedNeighborhoods], ([v1, v2]) => {
  if (typeof v2 === 'string') {
    return `#${v1.replace('m', '')}/${v2}`;
  } else if (Array.isArray(v2)) {
    return `#${v1.replace('m', '')}/${v2.join(',')}`;
  } else {
    throw new Error("Unexpected type for selectedNeighborhoods");
  }
});


hash.subscribe(value => {
  if (!browserNav) history.pushState({}, '', value)
  browserNav = false
})
window.addEventListener('popstate', () => {
  browserNav = true;
  const [metricArg, neighborhoodsArg] = readHashArgs();
  if (metricArg) selectedMetric.set(metricArg);
  selectedNeighborhoods.set(neighborhoodsArg);
});

window.addEventListener('pushstate', () => {
  browserNav = true;
  const [metricArg, neighborhoodsArg] = readHashArgs();
  if (metricArg) selectedMetric.set(metricArg);
  selectedNeighborhoods.set(neighborhoodsArg);
});
