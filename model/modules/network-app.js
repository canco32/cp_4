export default class NetworkApp {
    constructor(canvas, canvasContainer, config, menu, wire) {
        this.canvas = canvas;
        this.canvasContainer = canvasContainer;
        this.routerCounter = 0;
        this.workstationCounter = 0;
        this.elements = [];
        this.isWireMode = false;
        this.isRemoveWireMode = false;
        this.isRemoveObjectMode = false;
        this.startElement = null;
        this.endElement = null;
        this.networkConfig = config;

        this.wireManager = wire;
        this.sideMenu = menu; 
    }

    createElement(type, x = null, y = null, id = null, objectStatus = 'on') {
        const iconMap = {
            router: '🛜',
            workstation: '💻'
        };

        const posX = x ?? this.generateUniquePosition().x;
        const posY = y ?? this.generateUniquePosition().y;

        const element = document.createElement('div');
        element.classList.add('absolute', 'element', 'shadow-lg', 'cursor-move');
        element.style.width = '70px';
        element.style.height = '70px';
        element.style.left = `${posX}px`;
        element.style.top = `${posY}px`;
        element.style.backgroundColor = type === 'workstation' ? '#d4f5d4' : 'white';

        const icon = document.createElement('span');
        icon.classList.add('text-lg');
        icon.innerText = iconMap[type];

        const label = document.createElement('span');
        label.classList.add('text-xs');

        const counter = ++this[`${type}Counter`];
        label.innerText = `${counter}`;

        element.appendChild(icon);
        element.appendChild(label);
        this.canvas.appendChild(element);
        this.elements.push(element);

        this.makeDraggable(element);

        const uniqueId = id || `${type}-${counter}`;
        element.dataset.id = uniqueId; 
        element.dataset.type = type;  
        element.dataset.objectStatus = objectStatus;  

        element.addEventListener('dblclick', () => this.sideMenu.openMenu(element));

        this.networkConfig.addObject(type, posX, posY, uniqueId);

        return element;
    }

    createWireMode(addWireButton) {
        if (this.isWireMode) return;
        this.isWireMode = true;
        addWireButton.classList.add('button-active');

        this.boundHandleWireClick = this.handleWireClick.bind(this);
        this.canvas.addEventListener('click', this.boundHandleWireClick);
    }

    handleWireClick(event) {
        const target = event.target.closest('.element');
        if (!target) {
            if (this.startElement) {
                this.startElement.classList.remove('highlight');
                this.startElement = null;
            }
            this.exitWireMode();
            return;
        }

        if (!this.startElement) {
            this.startElement = target;
            this.startElement.classList.add('highlight');
        } else if (target !== this.startElement) {
            this.endElement = target;

            if (this.wireManager.isWireExisting(this.startElement, this.endElement)) {
                this.startElement.classList.remove('highlight');
                this.startElement = null;
                this.endElement = null;
                return;
            }

            const cableType = "default";
            const transmissionType = "duplex"; 

            const weight = this.wireManager.getWeight(this.calculateLength(this.startElement, this.endElement));

            const wire = this.wireManager.createWire(this.startElement, this.endElement, cableType, transmissionType, weight);
            this.networkConfig.addWire(wire);

            this.startElement.classList.remove('highlight');
            this.endElement.classList.remove('highlight');
            this.startElement = null;
            this.endElement = null;

            this.exitWireMode();
        }
    }

    calculateLength(startElement, endElement) {
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();

        return Math.sqrt(
            Math.pow(endRect.left - startRect.left, 2) + Math.pow(endRect.top - startRect.top, 2)
        );
    }

    exitWireMode() {
        this.isWireMode = false;
        document.getElementById('add-wire').classList.remove('button-active');
        this.canvas.removeEventListener('click', this.boundHandleWireClick);
        this.boundHandleWireClick = null;
        this.startElement = null;
        this.endElement = null;
    }

    createRemoveWireMode(removeWireButton) {
        if (this.isRemoveWireMode) return;
        this.isRemoveWireMode = true;
        removeWireButton.classList.add('button-active');

        this.boundHandleWireRemoval = this.handleWireRemoval.bind(this);
        this.canvas.addEventListener('click', this.boundHandleWireRemoval);
    }

    handleWireRemoval(event) {
        const wire = event.target.closest('.wire');
        if (wire) {
            this.wireManager.removeWire(wire);
        }
        this.exitRemoveWireMode();
    }

    exitRemoveWireMode() {
        this.isRemoveWireMode = false;
        document.getElementById('remove-wire').classList.remove('button-active');
        this.canvas.removeEventListener('click', this.boundHandleWireRemoval);
        this.boundHandleWireRemoval = null;
    }

    createRemoveObjectMode(removeObjectButton) {
        if (this.isRemoveObjectMode) return;
        this.isRemoveObjectMode = true;
        removeObjectButton.classList.add('button-active');

        this.boundHandleObjectRemoval = this.handleObjectRemoval.bind(this);
        this.canvas.addEventListener('click', this.boundHandleObjectRemoval);
    }

    handleObjectRemoval(event) {
        const target = event.target.closest('.element');
        if (target) {
            const wiresToRemove = [];
            this.wireManager.wires.forEach(wire => {
                if (wire.start === target || wire.end === target) {
                    wiresToRemove.push(wire);
                }
            });

            wiresToRemove.forEach(wire => {
                this.wireManager.removeWire(wire);
            });

            this.canvas.removeChild(target);
            const index = this.elements.indexOf(target);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
        }
        this.exitRemoveObjectMode();
    }

    exitRemoveObjectMode() {
        this.isRemoveObjectMode = false;
        document.getElementById('remove-object').classList.remove('button-active');
        this.canvas.removeEventListener('click', this.boundHandleObjectRemoval);
        this.boundHandleObjectRemoval = null;
    }

    makeDraggable(element) {
        interact(element).draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: this.canvasContainer,
                    endOnly: true
                })
            ],
            listeners: {
                move: (event) => this.handleDrag(event, element)
            }
        });
    }

    handleDrag(event, element) {
        let x = (parseFloat(element.getAttribute('data-x')) || 0) + event.dx;
        let y = (parseFloat(element.getAttribute('data-y')) || 0) + event.dy;

        const elementRect = element.getBoundingClientRect();
        const canvasRect = this.canvasContainer.getBoundingClientRect();

        for (const other of this.elements) {
            if (other !== element) {
                const otherRect = other.getBoundingClientRect();
                if (
                    elementRect.right + event.dx > otherRect.left &&
                    elementRect.left + event.dx < otherRect.right &&
                    elementRect.bottom + event.dy > otherRect.top &&
                    elementRect.top + event.dy < otherRect.bottom
                ) {
                    return;
                }
            }
        }

        if (elementRect.left + event.dx < canvasRect.left) x -= event.dx;
        if (elementRect.top + event.dy < canvasRect.top) y -= event.dy;
        if (elementRect.right + event.dx > canvasRect.right) x -= event.dx;
        if (elementRect.bottom + event.dy > canvasRect.bottom) y -= event.dy;

        element.style.transform = `translate(${x}px, ${y}px)`;
        element.setAttribute('data-x', x);
        element.setAttribute('data-y', y);

        this.wireManager.wires.forEach(wire => {
            if (wire.start === element || wire.end === element) {
                this.wireManager.updateWire(wire);
            }
        });
    }

    generateUniquePosition() {
        let x, y;
        let overlap;
        do {
            x = Math.random() * (this.canvas.offsetWidth - 70);
            y = Math.random() * (this.canvas.offsetHeight - 70);
            
            overlap = this.isOverlapping(x, y);
        } while (overlap); 

        return { x, y };
    }

    isOverlapping(x, y) {
        return this.elements.some(el => {
            const rect = el.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const elX = rect.left - canvasRect.left;
            const elY = rect.top - canvasRect.top;
            
            return Math.abs(elX - x) < 70 && Math.abs(elY - y) < 70;
        });
    }

    getNetworkConfig() {
        this.networkConfig.objects = [];
        this.networkConfig.wires = [];

        this.elements.forEach((element) => {
            this.networkConfig.addObject(element.dataset.type, parseFloat(element.style.left), parseFloat(element.style.top), element.dataset.id, element.dataset.objectStatus);
        });

        this.wireManager.wires.forEach((wire) => {
            const wireData = {
                id: wire.dataset.id,
                startId: wire.start.dataset.id,
                endId: wire.end.dataset.id,
                cableType: wire.dataset.channelType,
                transmissionType: wire.dataset.transmissionType,
                weight: wire.dataset.weight,
                objectStatus: wire.dataset.objectStatus  
            };
            this.networkConfig.addWire(wireData);
        });
        return this.networkConfig;
    }
    downloadConfig() {
        this.networkConfig.objects = [];
        this.networkConfig.wires = [];

        this.elements.forEach((element) => {
            this.networkConfig.addObject(element.dataset.type, parseFloat(element.style.left), parseFloat(element.style.top), element.dataset.id, element.dataset.objectStatus);
        });

        this.wireManager.wires.forEach((wire) => {
            const wireData = {
                id: wire.dataset.id,
                startId: wire.start.dataset.id,
                endId: wire.end.dataset.id,
                cableType: wire.dataset.channelType,
                transmissionType: wire.dataset.transmissionType,
                weight: wire.dataset.weight,
                objectStatus: wire.dataset.objectStatus 
            };
            this.networkConfig.addWire(wireData);
        });

        const json = this.networkConfig.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'network-config.json';
        a.click();
    }

    loadConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = e.target.result;
            const config = this.networkConfig.importFromJSON(jsonData);
            this.applyConfig(config);
        };
        reader.readAsText(file);
    }

    applyConfig(config) {
        this.elements.forEach(element => this.canvas.removeChild(element));
        this.wireManager.wires.forEach(wire => {
            this.canvas.removeChild(wire);
            this.canvas.removeChild(wire.label);
        });

        this.elements = [];
        this.wireManager.wires = [];

        config.objects.forEach((obj) => {
            let { x, y } = obj; 
            while (this.isOverlapping(x, y)) {
                const newPosition = this.generateUniquePosition();
                x = newPosition.x;
                y = newPosition.y;
            }
            this.createElement(obj.type, x, y, obj.id, obj.objectStatus);  

            const element = this.elements.find(el => el.dataset.id === obj.id);
            if (element) {
                element.dataset.objectStatus = obj.objectStatus; 
                element.style.opacity = (obj.objectStatus === 'off') ? '0.5' : '1';
            }
        });

        config.wires.forEach((wire) => {
            const startElement = this.elements.find(el => el.dataset.id === wire.startId);
            const endElement = this.elements.find(el => el.dataset.id === wire.endId);

            if (startElement && endElement) {
                const newWire = this.wireManager.createWire(startElement, endElement, wire.cableType, wire.transmissionType, wire.weight, wire.objectStatus);
            }
        })
    }

    
    getRandomWeight() {
        const weights = [3, 5, 6, 8, 10, 12, 17, 20, 25, 27];
        return weights[Math.floor(Math.random() * weights.length)];
    }

    createRandomizedNetwork() {
        this.elements.forEach(element => this.canvas.removeChild(element));
        this.wireManager.wires.forEach(wire => {
            this.canvas.removeChild(wire);
            this.canvas.removeChild(wire.label);
        });
        this.elements = [];
        this.wireManager.wires = [];

        this.routerCounter = 0;
        this.workstationCounter = 0;

        const routers = [];
        const regionWidth = 450;
        const routerSpacingX = 250;
        const routerSpacingY = 300;
        const regionHeight = 300;
        const regionY1 = 20;
        const regionY2 = regionHeight;

        const routerConnections = Array(24).fill().map(() => []);

        for (let i = 0; i < 12; i++) {
            const x = (i % 6) * routerSpacingX;
            const y = Math.floor(i / 6) * routerSpacingY + regionY1;
            const router = this.createElement('router', x, y);
            routers.push(router);

            const workstationX = x + 80;
            const workstationY = y + 60 + Math.floor(Math.random() * 150) + 1;
            const workstation = this.createElement('workstation', workstationX, workstationY);

            this.wireManager.createWire(
                router, 
                workstation, 
                'default', 
                Math.random() < 0.5 ? 'duplex' : 'halfduplex', 
                this.getRandomWeight()
            );
        }

        for (let i = 12; i < 24; i++) {
            const x = (i % 6) * routerSpacingX;
            const y = Math.floor(i / 6) * routerSpacingY + regionY2 - 50;
            const router = this.createElement('router', x, y);
            routers.push(router);

            const workstationX = x + 80;
            const workstationY = y + 80 + Math.floor(Math.random() * 100) + 1;
            const workstation = this.createElement('workstation', workstationX, workstationY);

            this.wireManager.createWire(
                router, 
                workstation, 
                'default', 
                Math.random() < 0.5 ? 'duplex' : 'halfduplex', 
                this.getRandomWeight()
            );
        }

        const randomRouter1 = routers[Math.floor(Math.random() * 12)];
        const randomRouter2 = routers[12 + Math.floor(Math.random() * 12)];

        this.wireManager.createWire(randomRouter1, randomRouter2, 'satellite', 'duplex', 27);

        const randomRouter3 = routers[Math.floor(Math.random() * 12)];
        const randomRouter4 = routers[12 + Math.floor(Math.random() * 12)];

        this.wireManager.createWire(randomRouter3, randomRouter4, 'satellite', 'duplex', 25);

        const createConnections = (regionStart, regionEnd) => {
        for (let i = regionStart; i < regionEnd; i++) {
            let connections = routerConnections[i];

            let attempts = 0;
            const maxAttempts = 100;

            while (connections.length < 3 && attempts < maxAttempts) {
                const targetIndex = Math.floor(Math.random() * (regionEnd - regionStart)) + regionStart;

                if (
                    targetIndex !== i && 
                    !connections.includes(targetIndex) && 
                    routerConnections[targetIndex].length < 3
                ) {
                    this.wireManager.createWire(
                        routers[i], 
                        routers[targetIndex], 
                        'default', 
                        Math.random() < 0.5 ? 'duplex' : 'halfduplex', 
                        this.getRandomWeight()
                    );
                    connections.push(targetIndex);
                    routerConnections[targetIndex].push(i);
                }

                attempts++;
            }

            if (i >= regionEnd - 2 && connections.length < 3) {
                while (connections.length < 3) {
                    const targetIndex = (connections.length === 2) ? regionStart : Math.floor(Math.random() * (regionEnd - regionStart)) + regionStart;

                    if (
                        targetIndex !== i && 
                        !connections.includes(targetIndex)
                    ) {
                        this.wireManager.createWire(
                            routers[i], 
                            routers[targetIndex], 
                            'default', 
                            Math.random() < 0.5 ? 'duplex' : 'halfduplex', 
                            this.getRandomWeight()
                        );
                        connections.push(targetIndex);
                        if (!routerConnections[targetIndex].includes(i)) {
                            routerConnections[targetIndex].push(i);
                        }
                    }
                }
            }
        }
    };

        createConnections(0, 12);
        createConnections(12, 24);
    }

    transferDataMenuOpen() {
        this.sideMenu.openTransferDataMenu();
    }
}