<div class="DraggebleItem-comp" style={orderStyle} draggable="true" 
        on:dragstart={onDrag}
        on:dragenter={onDragEnter}>
    <slot />
</div>

<script>
import { createEventDispatcher } from "svelte"
export let temp_index = 0  


export let id = 0
export let orderIndex = 0 
$: orderStyle = `order:${orderIndex}`

const dispatche = createEventDispatcher() 
const onDrag = () => {
    dispatche("element-draged",{id,orderIndex})
}
const onDragEnter = () => {
    dispatche("sorte-list",{newOrder:orderIndex})
}
</script>

<style type="text/scss">
.DraggebleItem-comp {
    background: rgb(105, 105, 105);
    color: white;

    height: fit-content;
    width: fit-content;
    h1 {
        font-size: 16px;
    }
}
</style>