export default class PacketTransfer {
    constructor(networkConfig) {
        this.networkConfig = networkConfig;
        this.graph = this.buildGraph();
        this.highlightedElements = new Set(); 
        this.packets = []; 
    }

    buildGraph() {
        const graph = {};

        this.networkConfig.objects.forEach(obj => {
            graph[obj.id] = { 
                neighbors: [],
                objectStatus: obj.objectStatus
            };
        });

        this.networkConfig.wires.forEach(wire => {
            const startNode = wire.startId;
            const endNode = wire.endId;
            const weight = parseFloat(wire.weight);
            const transmissionType = wire.transmissionType;
            const objectStatus = wire.objectStatus;

            if (objectStatus === 'on') {
                graph[startNode].neighbors.push({ id: endNode, weight, transmissionType, objectStatus });
                graph[endNode].neighbors.push({ id: startNode, weight, transmissionType, objectStatus });
            }
        });

        return graph;
    }

    dijkstraAll(startId) {
        const distances = {};
        const previousNodes = {};
        const unvisitedNodes = new Set(Object.keys(this.graph));

        unvisitedNodes.forEach(node => {
            distances[node] = node === startId ? 0 : Infinity;
            previousNodes[node] = null;
        });

        while (unvisitedNodes.size > 0) {
            let currentNode = null;
            unvisitedNodes.forEach(node => {
                if (currentNode === null || distances[node] < distances[currentNode]) {
                    currentNode = node;
                }
            });

            if (distances[currentNode] === Infinity) break; 

            this.graph[currentNode].neighbors.forEach(neighbor => {
                if (unvisitedNodes.has(neighbor.id) && this.graph[neighbor.id].objectStatus === 'on') {
                    const alt = distances[currentNode] + neighbor.weight;
                    if (alt < distances[neighbor.id]) {
                        distances[neighbor.id] = alt;
                        previousNodes[neighbor.id] = currentNode;
                    }
                }
            });

            unvisitedNodes.delete(currentNode);
        }

        const routes = {};
        Object.keys(this.graph).forEach(node => {
            const path = [];
            let currentNode = node;
            while (previousNodes[currentNode]) {
                path.unshift(currentNode);
                currentNode = previousNodes[currentNode];
            }
            if (distances[node] !== Infinity && node !== startId) {
                path.unshift(startId);
            }
            routes[node] = { distance: distances[node], path: path.length > 1 ? path : null };
        });

        return routes;
    }

    displayWorkstationRoutingTable(startId) {
        const tableDiv = document.getElementById('table');
        tableDiv.innerHTML = ''; 

        const routes = this.dijkstraAll(startId);

        const table = document.createElement('table');
        table.classList.add('table', 'border', 'border-collapse', 'w-full');

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th class="border px-4 py-2">Target Workstation</th>
            <th class="border px-4 py-2">Distance</th>
            <th class="border px-4 py-2">Path</th>
        `;
        table.appendChild(headerRow);

        Object.entries(routes).forEach(([target, data]) => {
            if (target.startsWith('workstation-') && target !== startId) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border px-4 py-2">${target}</td>
                    <td class="border px-4 py-2">${data.distance === Infinity ? 'Unreachable' : data.distance}</td>
                    <td class="border px-4 py-2">${data.path ? data.path.join(' -> ') : 'N/A'}</td>
                `;
                table.appendChild(row);
            }
        });

        tableDiv.appendChild(table);
    }

    dijkstra(startId, endId) {
        const distances = {};
        const previousNodes = {};
        const unvisitedNodes = new Set(Object.keys(this.graph));

        unvisitedNodes.forEach(node => {
            distances[node] = node === startId ? 0 : Infinity;
            previousNodes[node] = null;
        });

        while (unvisitedNodes.size > 0) {
            let currentNode = null;
            unvisitedNodes.forEach(node => {
                if (currentNode === null || distances[node] < distances[currentNode]) {
                    currentNode = node;
                }
            });

            if (distances[currentNode] === Infinity) break;

            this.graph[currentNode].neighbors.forEach(neighbor => {
                if (unvisitedNodes.has(neighbor.id) && this.graph[neighbor.id].objectStatus === 'on') {
                    const alt = distances[currentNode] + neighbor.weight;
                    if (alt < distances[neighbor.id]) {
                        distances[neighbor.id] = alt;
                        previousNodes[neighbor.id] = currentNode;
                    }
                }
            });

            unvisitedNodes.delete(currentNode);
        }

        const path = [];
        let currentNode = endId;
        while (previousNodes[currentNode]) {
            path.unshift(currentNode);
            currentNode = previousNodes[currentNode];
        }

        if (distances[endId] === Infinity) {
            return null; 
        }

        path.unshift(startId);
        return path;
    }

    highlightPath(path) {
        this.clearHighlights();

        path.forEach((stationId, index) => {
            const element = document.querySelector(`[data-id="${stationId}"]`);
            if (element) {
                element.classList.add('highlight');
                this.highlightedElements.add(element);
            }

            if (index < path.length - 1) {
                const nextStationId = path[index + 1];
                const cable = this.networkConfig.wires.find(wire => 
                    (wire.startId === stationId && wire.endId === nextStationId && wire.objectStatus === 'on') ||
                    (wire.startId === nextStationId && wire.endId === stationId && wire.objectStatus === 'on')
                );
                if (cable) {
                    const cableElement = document.querySelector(`[data-id="${cable.id}"]`);
                    if (cableElement) {
                        cableElement.classList.add('highlight');
                        this.highlightedElements.add(cableElement);
                    }
                }
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.highlight').forEach(element => {
            element.classList.remove('highlight');
        });
        this.highlightedElements.clear();
    }

    getPathDetails(path) {
        const details = [];

        path.forEach((stationId, index) => {
            if (index < path.length - 1) {
                const nextStationId = path[index + 1];
                const cable = this.networkConfig.wires.find(wire => 
                    (wire.startId === stationId && wire.endId === nextStationId && wire.objectStatus === 'on') ||
                    (wire.startId === nextStationId && wire.endId === stationId && wire.objectStatus === 'on')
                );

                if (cable) {
                    details.push({
                        id: cable.id,
                        startId: cable.startId,
                        endId: cable.endId,
                        cableType: cable.cableType,
                        transmissionType: cable.transmissionType,
                        weight: cable.weight,
                        objectStatus: cable.objectStatus
                    });
                }
            }
        });

        return {
            path, 
            details 
        };
    }

    calculateTransmissionDetails(pathDetails) {
        let totalTransmissionTime = 0;
        let lossProbability = 0;

        pathDetails.details.forEach(connection => {
            let connectionTime = parseFloat(connection.weight);

            if (connection.cableType === "satellite") {
                connectionTime += 20; 
                lossProbability += 0.05; 
            } else {
                lossProbability += 0.03;
            }

            if (connection.transmissionType === "halfduplex") {
                connectionTime += 15;
                lossProbability += 0.04;
            } else if (connection.transmissionType === "duplex") {
                connectionTime += 5;
                lossProbability += 0.02;
            }

            totalTransmissionTime += connectionTime;
        });

        lossProbability = Math.min(1, lossProbability);

        return {
            totalTransmissionTime,
            lossProbability
        };
    }

    tcpTransferSimulation(path, dataSize) {
        const controlPackets = 5;
        const retransmissionPenalty = 100; 
        const headerSize = 40; 
        const maxPacketSize = 1500; 
        const dataPayloadSize = maxPacketSize - headerSize; 

        if (!dataSize || isNaN(dataSize)) {
            console.error("Invalid dataSize provided.");
            return;
        }

        const pathDetails = this.getPathDetails(path);
        const transmissionDetails = this.calculateTransmissionDetails(pathDetails);

        const adaptiveRetransmissionChance = transmissionDetails.lossProbability;
        const adaptiveFixedDelay = transmissionDetails.totalTransmissionTime;

        const dataPackets = Math.ceil(dataSize / dataPayloadSize);
        const tcpPackets = [];
        let totalTime = 0;
        let retransmittedPackets = 0;
        let totalControlPackets = controlPackets; 

        tcpPackets.push({
            type: "Control",
            id: "SYN",
            header: "TCP Header",
            payload: null,
            status: "Sent",
        });
        tcpPackets.push({
            type: "Control",
            id: "SYN-ACK",
            header: "TCP Header",
            payload: null,
            status: "Sent",
        });
        tcpPackets.push({
            type: "Control",
            id: "ACK",
            header: "TCP Header",
            payload: null,
            status: "Sent",
        });
        totalTime += path.length * adaptiveFixedDelay * 3;

        let remainingData = dataSize;
        let packetCount = 0;

        while (remainingData > 0) {
            const payloadSize = Math.min(dataPayloadSize, remainingData);
            let isSuccess = false;
            packetCount++;

            while (!isSuccess) {
                tcpPackets.push({
                    type: "Data",
                    id: `Data-${packetCount}`,
                    header: "TCP Header",
                    payload: `${payloadSize} bytes`,
                    status: "Sent",
                });

                if (Math.random() > adaptiveRetransmissionChance) {
                    isSuccess = true; 
                    tcpPackets[tcpPackets.length - 1].status = "Delivered";
                    tcpPackets.push({
                        type: "Control",
                        id: `ACK-${packetCount}`,
                        header: "TCP Header",
                        payload: null,
                        status: "Sent",
                    });
                    totalControlPackets++;
                } else {
                    tcpPackets[tcpPackets.length - 1].status = "Lost";
                    retransmittedPackets++;
                    totalTime += retransmissionPenalty; 
                }
            }

            remainingData -= payloadSize;
            totalTime += path.length * adaptiveFixedDelay;
        }

        tcpPackets.push({
            type: "Control",
            id: "FIN",
            header: "TCP Header",
            payload: null,
            status: "Sent",
        });
        tcpPackets.push({
            type: "Control",
            id: "FIN-ACK",
            header: "TCP Header",
            payload: null,
            status: "Sent",
        });
        totalControlPackets += 2;
        totalTime += path.length * adaptiveFixedDelay * 2;

        console.log("TCP Packet Details:", tcpPackets);

        return {
            totalPackets: tcpPackets.length,
            controlPackets: totalControlPackets,
            dataPackets: packetCount,
            retransmittedPackets,
            totalTime,
            packetDetails: tcpPackets,
        };
    }

    udpTransferSimulation(path, dataSize) {
        const headerSize = 28;
        const maxPacketSize = 1500; 
        const dataPayloadSize = maxPacketSize - headerSize; 

        if (!dataSize || isNaN(dataSize)) {
            console.error("Invalid dataSize provided.");
            return;
        }

        const pathDetails = this.getPathDetails(path);
        const transmissionDetails = this.calculateTransmissionDetails(pathDetails);

        const adaptiveFixedDelay = transmissionDetails.totalTransmissionTime;
        const lossProbability = transmissionDetails.lossProbability;

        const dataPackets = Math.ceil(dataSize / dataPayloadSize);
        const udpPackets = [];
        let totalTime = 0;
        let lostPackets = 0;

        let remainingData = dataSize;
        let packetCount = 0;

        while (remainingData > 0) {
            const payloadSize = Math.min(dataPayloadSize, remainingData);
            packetCount++;

            const packet = {
                type: "Data",
                id: `Data-${packetCount}`,
                header: "UDP Header",
                payload: `${payloadSize} bytes`,
                status: Math.random() > lossProbability ? "Delivered" : "Lost",
            };

            udpPackets.push(packet);

            if (packet.status === "Lost") {
                lostPackets++;
            }

            remainingData -= payloadSize;
            totalTime += path.length * adaptiveFixedDelay;
        }

        console.log("UPD Packet Details:", udpPackets);

        return {
            totalPackets: udpPackets.length,
            dataPackets: packetCount,
            lostPackets,
            totalTime,
            packetDetails: udpPackets,
        };
    }

    transferDataWithProtocols(fromWorkstationId, toWorkstationId, dataSize) {
        const path = this.dijkstra(fromWorkstationId, toWorkstationId);

        if (!path) {
            console.log(`No path found between ${fromWorkstationId} and ${toWorkstationId}`);
            return;
        }

        const resultDiv = document.getElementById('result-transfer-div');
        resultDiv.innerHTML = ''; 

        const tcp = this.tcpTransferSimulation(path, dataSize);

        resultDiv.innerHTML = `
            <br><b>TCP:</b><br>
            Total Packets Sent: ${tcp.totalPackets}<br>
            Information Packets: ${tcp.dataPackets}<br>
            Control Packets: ${tcp.controlPackets}<br>
            Retransmitted Packets: ${tcp.retransmittedPackets}<br>
            Total Time: ${tcp.totalTime} ms<br>
        `;

        const udp = this.udpTransferSimulation(path, dataSize);

        resultDiv.innerHTML += `
            <br><b>UDP:</b><br>
            Total Packets Sent: ${udp.totalPackets}<br>
            Information Packets: ${udp.dataPackets}<br>
            Control Packets: 0<br>
            Lost Packets: ${udp.lostPackets}<br>
            Total Time: ${udp.totalTime} ms<br>
        `;
        

        this.highlightPath(path);
        this.displayWorkstationRoutingTable(fromWorkstationId);

    }


}