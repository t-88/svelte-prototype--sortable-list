<div class="DraggebleItem-comp" draggable="true" 
    bind:this={ref} on:dragstart={onDrag} on:dragend={onDrop}>
    <h1>#{index}</h1>
</div>

<script>
import {createEventDispatcher} from "svelte"
const dispatche = createEventDispatcher() 
export let index = 0
export let orderIndex = 0 
let ref = null
const onDrag = () => {
    dispatche("element-draged",{index,orderIndex,ref})
    ref.style.opacity = "1"
    dispatche("errorasd")
}
const onDrop = () => {
    dispatche("element-droped",orderIndex)
    ref.style.opacity = "1"
}
</script>

<style type="text/scss">
.DraggebleItem-comp {
    background: rgb(105, 105, 105);
    color: white;

    height: 40px;
    width: 190px;
    h1 {
        font-size: 16px;
    }
}
</style>