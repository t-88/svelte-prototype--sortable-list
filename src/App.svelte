<div id="app">
	<div class="drag-zoons">
		{#each [...Array(10).keys()] as i}
		<DragZoon {currDraggedElement} {currDraggedElementID} currChiledID={i} orderIndex={orderList[i]}
				  on:element-draged={registerDragedElement} 
				  on:element-droped={unregisterDragedElement}
				  on:drag-zoon-enter={dragZoonEnter}
				on:sorte-list={sorteList} {currChiledIndex}/>
		{/each}
	</div>
	{#each [...Array(10).keys()] as i}
		<p>{orderList[i]}</p>
	{/each}
</div>

<script>
import DragZoon from "./components/DragZoon.svelte"


let currDraggedElementID = null
let currDraggedElement = ""
let currChiledIndex = 0 
let orderList = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
]

const sorteList = ({detail}) => {
	console.log((detail.oldOrder < detail.new) === true ? "top to bottom": "bottom to top")
	if(detail.oldOrder < detail.new) {
		console.log("------------------------------")
		for(let i = detail.oldOrder+1; i <= detail.new; i++){
			orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] - 1
			console.log(orderList[i])
		}
		console.log("------------------------------")
		orderList[detail.old] = detail.new
		currDraggedElementID = detail.new
	} else {
		console.log("------------------------------")
		for(let i = detail.new; i < detail.oldOrder; i++){
			orderList[orderList.indexOf(i)] = orderList[orderList.indexOf(i)] + 1
			console.log(orderList[i])
		}
		console.log("------------------------------")
		orderList[detail.old] = detail.new
		currDraggedElementID = detail.new
	}


}
const dragZoonEnter = ({detail}) => {
}

const registerDragedElement = ({detail}) => {

	currDraggedElementID = detail.orderIndex
	currDraggedElement = detail.ref
	currChiledIndex = detail.index
}
const unregisterDragedElement = ({detail}) => {
	//currDraggedElementID = null
}
</script>

<style>
#app {
	display: flex
}

.drag-zoons {
	background: blue;
	width: 200px;
    margin: auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>