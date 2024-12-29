export default class SideMenu {
    constructor(container, networkConfig) {
        this.container = container;
        this.menu = null;
        this.transferDataMenu = null; 
        this.networkConfig = networkConfig;
    }

    openMenu(object) {
        if (this.menu) {
            this.updateMenu(object);
            this.menu.style.transform = 'translateX(0)'; 
        } else {
            this.createMenu(object);
        }
    }

    closeMenu() {
        if (this.menu) {
            this.menu.style.transform = 'translateX(100%)'; 
        }
    }

    openTransferDataMenu() {
        if (!this.transferDataMenu) {
            this.createTransferDataMenu();
        }

        this.transferDataMenu.style.transform = 'translateX(0)';
    }

    closeTransferDataMenu() {
        if (this.transferDataMenu) {
            this.transferDataMenu.style.transform = 'translateX(-100%)';
        }
    }

    createMenu(object) {
        this.menu = document.createElement('div');
        this.menu.classList.add('side-menu', 'fixed', 'top-0', 'right-0', 'z-20', 'w-96', 'h-full', 'bg-white', 'shadow-xl', 'p-6', 'transform', 'translate-x-full');

        const title = document.createElement('h2');
        title.classList.add('text-xl', 'font-semibold');
        title.innerText = 'Configuration';
        this.menu.appendChild(title);

        const details = document.createElement('div');
        details.classList.add('mt-4');

        if (object.classList.contains('wire')) {
            // Если это кабель
            details.innerHTML = `
                <p><strong>ID:</strong> ${object.dataset.id}</p>
                <p><strong>Channel Type:</strong> 
                    <select class="channel-type-select">
                        <option value="default" ${object.dataset.channelType === 'default' ? 'selected' : ''}>default</option>
                        <option value="satellite" ${object.dataset.channelType === 'satellite' ? 'selected' : ''}>satellite</option>
                    </select>
                </p>
                <p><strong>Transmission Type:</strong> 
                    <select class="transmission-type-select">
                        <option value="duplex" ${object.dataset.transmissionType === 'duplex' ? 'selected' : ''}>duplex</option>
                        <option value="halfduplex" ${object.dataset.transmissionType === 'halfduplex' ? 'selected' : ''}>halfduplex</option>
                    </select>
                </p>
                <p><strong>Weight:</strong> ${object.dataset.weight}</p>
                <p><strong>X:</strong> ${parseFloat(object.style.left)}px</p>
                <p><strong>Y:</strong> ${parseFloat(object.style.top)}px</p>
                <p><strong>Status:</strong> <input type="checkbox" class="toggle-status" ${object.dataset.objectStatus === 'off' ? '' : 'checked'} /> Active</p>
            `;
            details.querySelector('.channel-type-select').addEventListener('change', (e) => this.updateCableType(e, object));
            details.querySelector('.transmission-type-select').addEventListener('change', (e) => this.updateTransmissionType(e, object));
            details.querySelector('.toggle-status').addEventListener('change', (e) => this.toggleStatus(e, object));

        } else {
            details.innerHTML = `
                <p><strong>ID:</strong> ${object.dataset.id}</p>
                <p><strong>Type:</strong> ${object.dataset.type}</p>
                <p><strong>X:</strong> ${parseFloat(object.style.left)}px</p>
                <p><strong>Y:</strong> ${parseFloat(object.style.top)}px</p>
                <p><strong>Status:</strong> <input type="checkbox" class="toggle-status" ${object.dataset.objectStatus === 'off' ? '' : 'checked'} /> Active</p>
            `;
            details.querySelector('.toggle-status').addEventListener('change', (e) => this.toggleStatus(e, object));
        }

        this.menu.appendChild(details);

        const closeButton = document.createElement('button');
        closeButton.classList.add('mt-6', 'py-2', 'px-4', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700', 'transition', 'duration-200');
        closeButton.innerText = 'Close';
        closeButton.addEventListener('click', () => this.closeMenu());
        this.menu.appendChild(closeButton);

        this.container.appendChild(this.menu);
    }

    createTransferDataMenu() {
        this.transferDataMenu = document.createElement('div');
        this.transferDataMenu.classList.add('side-menu', 'fixed', 'top-0', 'left-0', 'z-20', 'w-96', 'h-full', 'bg-white', 'shadow-xl', 'p-6', 'transform', 'translate-x-full', 'transition-transform', 'duration-300');

        const title = document.createElement('h2');
        title.classList.add('text-xl', 'font-semibold');
        title.innerText = 'Transfer Data';
        this.transferDataMenu.appendChild(title);

        const details = document.createElement('div');
        details.classList.add('mt-4');

        details.innerHTML += `
            <p><strong>From Workstation:</strong>
                <select id="from-workstation-select"></select>
            </p>
            <p><strong>To Workstation:</strong>
                <select id="to-workstation-select"></select>
            </p>
            <p><strong>Data Size:</strong>
                <input type="number" id="data-size" value="1500" min="1" max="1500000" />
            </p>
        `;

        const fromWorkstationSelect = details.querySelector('#from-workstation-select');
        const toWorkstationSelect = details.querySelector('#to-workstation-select');

        const workstations = document.querySelectorAll('[data-type="workstation"]');

        workstations.forEach(workstation => {
            const id = workstation.dataset.id;
            const text = workstation.querySelector('.text-xs').innerText;

            const option = document.createElement('option');
            option.value = id;
            option.innerText = `${text} (${id})`; 
            fromWorkstationSelect.appendChild(option);

            const option2 = option.cloneNode(true);
            toWorkstationSelect.appendChild(option2);
        });


        // Добавляем кнопку Send
        const sendButton = document.createElement('button');
        sendButton.classList.add('mt-6', 'py-2', 'px-4', 'bg-green-500', 'text-white', 'rounded', 'hover:bg-green-700', 'transition', 'duration-200');
        sendButton.innerText = 'Send';
        sendButton.id = 'send-data-between';
        details.appendChild(sendButton);

        const resultBlock = document.createElement('div');
        resultBlock.id = 'result-transfer-div';

        this.transferDataMenu.appendChild(details);

        const closeButton = document.createElement('button');
        closeButton.classList.add('mt-6', 'py-2', 'px-4', 'bg-blue-500', 'text-white', 'rounded', 'hover:bg-blue-700', 'transition', 'duration-200');
        closeButton.innerText = 'Close';
        closeButton.addEventListener('click', () => this.closeTransferDataMenu());
        this.transferDataMenu.appendChild(closeButton);

        this.transferDataMenu.appendChild(resultBlock);

        this.container.appendChild(this.transferDataMenu);
    }

    getAllWorkstations() {
        const workstations = document.querySelectorAll('[data-type="workstation"]');
        
        const workstationIds = [];

        workstations.forEach(workstation => {
            workstationIds.push(workstation.dataset.id);
        });

        return workstationIds;
    }

    updateMenu(object) {
        const details = this.menu.querySelector('div');
        
        if (object.classList.contains('wire')) {
            details.innerHTML = ` 
                <p><strong>ID:</strong> ${object.dataset.id}</p>
                <p><strong>Channel Type:</strong> 
                    <select class="channel-type-select">
                        <option value="default" ${object.dataset.channelType === 'default' ? 'selected' : ''}>default</option>
                        <option value="satellite" ${object.dataset.channelType === 'satellite' ? 'selected' : ''}>satellite</option>
                    </select>
                </p>
                <p><strong>Transmission Type:</strong> 
                    <select class="transmission-type-select">
                        <option value="duplex" ${object.dataset.transmissionType === 'duplex' ? 'selected' : ''}>duplex</option>
                        <option value="halfduplex" ${object.dataset.transmissionType === 'halfduplex' ? 'selected' : ''}>halfduplex</option>
                    </select>
                </p>
                <p><strong>Weight:</strong> ${object.dataset.weight}</p>
                <p><strong>X:</strong> ${parseFloat(object.style.left)}px</p>
                <p><strong>Y:</strong> ${parseFloat(object.style.top)}px</p>
                <p><strong>Status:</strong> <input type="checkbox" class="toggle-status" ${object.dataset.objectStatus === 'off' ? '' : 'checked'} /> Active</p>`
            ;
            details.querySelector('.channel-type-select').addEventListener('change', (e) => this.updateCableType(e, object));
            details.querySelector('.transmission-type-select').addEventListener('change', (e) => this.updateTransmissionType(e, object));
            details.querySelector('.toggle-status').addEventListener('change', (e) => this.toggleStatus(e, object));
        } else {
            details.innerHTML = `
                <p><strong>ID:</strong> ${object.dataset.id}</p>
                <p><strong>Type:</strong> ${object.dataset.type}</p>
                <p><strong>X:</strong> ${parseFloat(object.style.left)}px</p>
                <p><strong>Y:</strong> ${parseFloat(object.style.top)}px</p>
                <p><strong>Status:</strong> <input type="checkbox" class="toggle-status" ${object.dataset.objectStatus === 'off' ? '' : 'checked'} /> Active</p>`
            ;
            details.querySelector('.toggle-status').addEventListener('change', (e) => this.toggleStatus(e, object));
        }
    }

    updateCableType(e, object) {
        object.dataset.channelType = e.target.value;
    }

    updateTransmissionType(e, object) {
        object.dataset.transmissionType = e.target.value;
    }

    toggleStatus(e, object) {
        const isActive = e.target.checked;

        if (isActive) {
            object.dataset.objectStatus = 'on'; 
            object.style.opacity = '1'; 
        } else {
            object.dataset.objectStatus = 'off';
            object.style.opacity = '0.5';
        }
    }
}