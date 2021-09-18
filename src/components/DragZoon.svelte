<div class="DragZoon-comp" style={`order:${orderIndex}`} on:dragenter={onDragEnter} bind:this={ref} 
                           on:dragover|preventDefault on:drop={onDrop}
    ><!--</div>class:chiled-not-there={!chiledThere}>-->
    <DraggableItem index={currChiledID}
        on:element-draged={onChiledDrag}
        on:element-droped={onChiledDroped}
        {orderIndex} 
        />
</div>

<script>
import {createEventDispatcher} from "svelte"
const dispatche = createEventDispatcher()

import DraggableItem from "./DraggableItem.svelte"
let ref = null
export let currChiledID = null
export let orderIndex = 0 
export let chiledThere = true
export let currDraggedElementID = null
export let currDraggedElement = null
export let currChiledIndex;
const onChiledDrag = ({detail}) => {
    chiledThere = false
    dispatche("element-draged",detail)
}
const onDragEnter = (e) => {
    if(orderIndex === currDraggedElementID) {return}
    console.log(orderIndex,currChiledIndex,currDraggedElementID)
    let msg_data = {new:orderIndex,old:currChiledIndex,oldOrder:currDraggedElementID}
    dispatche("sorte-list",msg_data)
    //let save = orderIndex
    //orderIndex = currDraggedElementID
    //currDraggedElement.parentElement.style.order = save 
    //ref.style.order = `${currChiledID}`
    //console.log(ref.style.order,currDraggedElement.parentElement.style.order)
}
const onDrop = (e) => {
    if(!chiledThere) {
        //ref.appendChild(currDraggedElement)
        //console.log("added a chiled")
    }
    chiledThere = true
    //console.log(chiledThere,"chiled there")
}
const onChiledDroped = ({detail}) => {
    dispatche("element-droped",detail)
    if(detail === currChiledID) { //drop rested
        chiledThere = true
    }
}
</script>

<style>
.DragZoon-comp {
    width: 200px;
    height: 50px;
    background: #bfbfbf;

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}
.chiled-not-there {
    background: red;
}

</style>