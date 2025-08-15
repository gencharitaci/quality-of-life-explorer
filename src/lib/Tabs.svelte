<script>
  import {
    selectedConfig,
    selectedMetric,
    dataConfig,
    dataCategories,
    whatsnew,
  } from "../store/store";

  // unique ../store/storees for tabs
  const categories = $dataCategories;

  // active category
  let activeCategory;
  $: {
    activeCategory = $selectedConfig.category;
  }
</script>

<style lang="postcss">
  .tabgroup .active {
    @apply border-b-pink-700 text-slate-700;
  }
  .metricgroup .active {
    @apply bg-pink-700 text-white shadow-md;
  }
</style>

<div class="md:hidden">
  <select
    bind:value={$selectedMetric}
    class="w-full py-3 px-1 rounded cursor-pointer text-xl font-bold bg-white"
  >
    {#each categories as cat}
      <optgroup label={cat}>
        {#each $dataConfig.filter((el) => el.category === cat) as metric}
          <option value={metric.metric}>{metric.title}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>

<div class="hidden md:block">
  <div class="border-b-2 border-slate-200 tabgroup">
    {#each categories as cat}
      <button
        class="px-2 py-2 border-y-4 border-white uppercase text-sm font-bold text-slate-400"
        class:active={activeCategory === cat}
        on:click={() => (activeCategory = cat)}
      >
        {cat}
      </button>
    {/each}
  </div>

  {#each categories as cat}
    <!-- <div class="px-2 pt-2 metricgroup" class:hidden={cat !== activeCategory}>
      {#each $dataConfig.filter((el) => el.category === cat) as metric}
        <button
          class="ml-2 mb-2 rounded-full bg-slate-200 hover:shadow-md transition-shadow text-sm"
          class:active={$selectedMetric === metric.metric}
          on:click={() => ($selectedMetric = metric.metric)}
        >
          <span class="py-2 px-3 inline-block">{metric.title}</span>
          {#if $whatsnew.indexOf(metric.metric) !== -1}
            <span class="bg-slate-700 text-white p-2 inline-block rounded-full"
              >new</span
            >
          {/if}
        </button>
      {/each}
    </div> -->
    
    <div class="metricgroup flex flex-wrap my-2" class:hidden={cat !== activeCategory}>
      {#each $dataConfig.filter((el) => el.category === cat) as metric}
        <button
          class="w-full border-b md:w-1/2 md:border-r lg:w-1/3 p-3 hover:bg-pink-700 hover:text-white"
          class:active={$selectedMetric === metric.metric}
          on:click={() => ($selectedMetric = metric.metric)}
        >
          <div class="flex items-center justify-between">
            <div class="ml-4 text-md">{metric.title}</div>
            {#if $whatsnew.indexOf(metric.metric) !== -1}
              <span
                class="ml-2 shadow-3xl shadow-gary-700 shadow-2xl shrink-0 rounded-full bg-slate-700 px-3 font-mono text-md font-medium tracking-tight text-yellow-200 hover:text-white"
              >
                New
              </span>
            {/if}
          </div>
        </button>
      {/each}
    </div>

  {/each}
</div>
