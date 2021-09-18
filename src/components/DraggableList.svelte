<div class="DraggbleList-comp">
{#each props as prop , index}
    <DraggableItem  {...{id:ids[index] ,temp_index:index ,orderIndex:orderList[index]}} 
    on:element-draged={registerDragedInfo} on:sorte-list={sorteList}>
        <svelte:component this={component} {...prop}/>
    </DraggableItem>
{/each}
</div>

<script>
import DraggableItem from "./DraggableItem.svelte";
import { _ as idGen} from "keygenerator"

export let len = 10
export let props = [{}]
export let component;

let ids = [] 
for(let i = 0; i < len; i++){
	ids.push(idGen())
}
let orderList = [...Array(len).keys()]
let draged_InitOrder = null
let draged_ID = 0

const sorteList = ({detail}) => {
    console.log(detail)
	if(draged_InitOrder < detail.newOrder) {
		for(let i = draged_InitOrder+1; i <= detail.newOrder; i++){
			orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] - 1
		}
	} else {
		for(let i = detail.newOrder; i < draged_InitOrder; i++){
			orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] + 1
		}
	}
	orderList[ids.indexOf(draged_ID)] = detail.newOrder
	draged_InitOrder = detail.newOrder
}
const registerDragedInfo = ({detail}) => {
	draged_InitOrder = detail.orderIndex
	draged_ID = detail.id
}
</script>

<style>
.DraggbleList-comp {
    display: flex;
    flex-direction: column;
}
</style>