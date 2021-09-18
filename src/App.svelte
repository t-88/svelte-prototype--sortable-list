<div id="app">
	<div class="drag-zoons">
		{#each [...Array(len).keys()] as i}
			<svelte:component this={DraggableItem} {...{id:ids[i] ,temp_index:i ,orderIndex:orderList[i]}} 
				on:element-draged={registerDragedInfo} on:sorte-list={sorteList}/>
		{/each}
	</div>
</div>

<script>
import DraggableItem from "./components/DraggableItem.svelte";
import { _ as idGen} from "keygenerator"

let draged_InitOrder = null
let draged_ID = 0 

let len = 10
let orderList = [...Array(len).keys()]
let ids = [] 
for(let i = 0; i < len; i++){
	ids.push(idGen())
}

const sorteList = ({detail}) => {
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
#app {
	display: flex
}

.drag-zoons {
	width: 200px;
    margin: auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>