declare global {
	var drawHabitability: () => void;
}

const habitabilityRenderer = (): void => {
	TIME && console.time("drawHabitability");

	const ocean = terrs.select<SVGGElement>("#oceanHabitability");
	const land = terrs.select<SVGGElement>("#landHabitability");

	ocean.selectAll("*").remove();
	land.selectAll("*").remove();

	console.log("TODO: Implement!")

	TIME && console.timeEnd("drawHabitability");
}

window.drawHabitability = habitabilityRenderer;
