<button on:click={dispatche("event",index)}>{index}</button>

<script>
import { createEventDispatcher } from "svelte" 
const dispatche = createEventDispatcher()

export let index = 0 
</script>
