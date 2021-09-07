export class Tooltip {

	constructor(item, removeCallback) {
		const div = document.createElement('div');
		div.innerHTML = `
		<div class="card--address">
			<div class="card__content">
				<div class="card__country">Spain</div>
				<div class="card__city">Sueca</div>
				<div class="card__name">${item.title}</div>
				<div class="card__address">${item.address}</div>
				<a class="card__phone" href="tel:0034961702100">Ph. +34 96 1702100</a>
				<a class="card__email" href="mailto:www.sipcaminagra.es">www.sipcaminagra.es</a>
			</div>
			<button class="card__close"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z"/></svg></button>
		</div>`;
		console.log(div.firstElementChild, item);
		this.element = div.firstElementChild;
		this.element.querySelector('.card__close').addEventListener('click', () => {
			if (typeof removeCallback === 'function') {
				removeCallback();
			}
		});
	}

}
