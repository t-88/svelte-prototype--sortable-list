<div id="app">
	<DraggableList len={5} component={Button} 
				   props={indexs}
				   event={{test:test}} />
</div>

<script>
import DraggableList from "./components/DraggableList.svelte";
import Button from "./components/Button.svelte"

let indexs = [
	{index: 0},
	{index: 1},
	{index: 2},
	{index: 3},
	{index: 4},
]

const test = ({detail}) => {
    console.log("test")
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