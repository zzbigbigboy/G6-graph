import G6 from '@antv/g6';

const { labelPropagation, louvain, findShortestPath } = G6.Algorithm;
const { uniqueId } = G6.Util;
import { isNumber, isArray } from '@antv/util';
import { g6OptionType, graphData, GraphDataEdge, GraphDataInfo, GraphDataNode } from './g6-data';
import G6GraphModel from './g6-graph';
const NODESIZEMAPPING = 'degree';
const SMALLGRAPHLABELMAXLENGTH = 5;
let labelMaxLength = SMALLGRAPHLABELMAXLENGTH;
const DEFAULTNODESIZE = 20;
const DEFAULTAGGREGATEDNODESIZE = 53;
const NODE_LIMIT = 40; // TODO: find a proper number for maximum node number on the canvas
let currentUnproccessedData = { nodes: [], edges: [] };
let nodeMap = {};
let aggregatedNodeMap = {};
let hiddenItemIds = []; // 隐藏的元素 id 数组
let largeGraphMode = true;
let cachePositions = {};
let manipulatePosition = undefined;
let descreteNodeCenter;
let layout = {
    type: '',
    instance: null,
    destroyed: true,
};
let expandArray = [];
let collapseArray = [];
let shiftKeydown = false;
let CANVAS_WIDTH = 800,
    CANVAS_HEIGHT = 800;

const duration = 2000;
const animateOpacity = 0.6;
const animateBackOpacity = 0.1;
const virtualEdgeOpacity = 0.1;
const realEdgeOpacity = 0.2;

const darkBackColor = 'rgb(43, 47, 51)';
const disableColor = '#777';
const theme = 'dark';
const subjectColors = [
    '#5F95FF', // blue
    '#61DDAA',
    '#65789B',
    '#F6BD16',
    '#7262FD',
    '#78D3F8',
    '#9661BC',
    '#F6903D',
    '#008685',
    '#F08BB4',
];

const colorSets = G6.Util.getColorSetsBySubjectColors(
    subjectColors,
    darkBackColor,
    theme,
    disableColor,
);

const global = {
    node: {
        style: {
            fill: '#2B384E',
        },
        labelCfg: {
            style: {
                fill: '#acaeaf',
                stroke: '#191b1c',
            },
        },
        stateStyles: {
            focus: {
                fill: '#2B384E',
            },
        },
    },
    edge: {
        style: {
            stroke: '#acaeaf',
            realEdgeStroke: '#acaeaf', //'#f00',
            realEdgeOpacity,
            strokeOpacity: realEdgeOpacity,
        },
        labelCfg: {
            style: {
                fill: '#acaeaf',
                realEdgeStroke: '#acaeaf', //'#f00',
                realEdgeOpacity: 0.5,
                stroke: '#191b1c',
            },
        },
        stateStyles: {
            focus: {
                stroke: '#fff', // '#3C9AE8',
            },
        },
    },
};
let moveID, open = false;

export enum ClickType {
    Node = 'node',
    Canvas = 'canvas',
    Edge = 'edge',
}

export default class G6ClassModel {
    protected _install: G6ClassModel;
    protected graph = null;

    protected constructor() {
        this.init()
    }

    public clearFocusItemState(graph) {
        if (!graph) return;
        this.clearFocusNodeState(graph);
        this.clearFocusEdgeState(graph);
    }

    // 清除图上所有节点的 focus 状态及相应样式
    public clearFocusNodeState = (graph) => {
        const focusNodes = graph.findAllByState('node', 'focus');
        focusNodes.forEach((fnode) => {
            graph.setItemState(fnode, 'focus', false); // false
        });
    };

    // 清除图上所有边的 focus 状态及相应样式
    public clearFocusEdgeState = (graph) => {
        const focusEdges = graph.findAllByState('edge', 'focus');
        focusEdges.forEach((fedge) => {
            graph.setItemState(fedge, 'focus', false);
        });
    };

    public stopLayout = () => {
        layout.instance.stop();
    };

    public formatText = (text, length = 5, elipsis = '...') => {
        if (!text) return '';
        if (text.length > length) {
            return `${text.substr(0, length)}${elipsis}`;
        }
        return text;
    };

    public labelFormatter = (text, minLength = 10) => {
        if (text && text.split('').length > minLength) return `${text.substr(0, minLength)}...`;
        return text;
    };

    public descendCompare = (p) => {
        // 这是比较函数
        return function (m, n) {
            const a = m[p];
            const b = n[p];
            return b - a; // 降序
        };
    };

    public getForceLayoutConfig = (graph, largeGraphMode, configSettings?) => {
        let {
            linkDistance,
            edgeStrength,
            nodeStrength,
            nodeSpacing,
            preventOverlap,
            nodeSize,
            collideStrength,
            alpha,
            alphaDecay,
            alphaMin,
        } = configSettings || { preventOverlap: true };

        if (!linkDistance && linkDistance !== 0) linkDistance = 225;
        if (!edgeStrength && edgeStrength !== 0) edgeStrength = 50;
        if (!nodeStrength && nodeStrength !== 0) nodeStrength = 200;
        if (!nodeSpacing && nodeSpacing !== 0) nodeSpacing = 5;

        const config = {
            type: 'gForce',
            minMovement: 0.01,
            maxIteration: 5000,
            preventOverlap,
            damping: 0.99,
            linkDistance: (d) => {
                let dist = linkDistance;
                const sourceNode = nodeMap[d.source] || aggregatedNodeMap[d.source];
                const targetNode = nodeMap[d.target] || aggregatedNodeMap[d.target];
                // // 两端都是聚合点
                // if (sourceNode.level && targetNode.level) dist = linkDistance * 3;
                // // 一端是聚合点，一端是真实节点
                // else if (sourceNode.level || targetNode.level) dist = linkDistance * 1.5;
                if (!sourceNode.level && !targetNode.level) dist = linkDistance * 0.3;
                return dist;
            },
            edgeStrength: (d) => {
                const sourceNode = nodeMap[d.source] || aggregatedNodeMap[d.source];
                const targetNode = nodeMap[d.target] || aggregatedNodeMap[d.target];
                // 聚合节点之间的引力小
                if (sourceNode.level && targetNode.level) return edgeStrength / 2;
                // 聚合节点与真实节点之间引力大
                if (sourceNode.level || targetNode.level) return edgeStrength;
                return edgeStrength;
            },
            nodeStrength: (d) => {
                // 给离散点引力，让它们聚集
                if (d.degree === 0) return -10;
                // 聚合点的斥力大
                if (d.level) return nodeStrength * 2;
                return nodeStrength;
            },
            nodeSize: (d) => {
                if (!nodeSize && d.size) return d.size;
                return 50;
            },
            nodeSpacing: (d) => {
                if (d.degree === 0) return nodeSpacing * 2;
                if (d.level) return nodeSpacing;
                return nodeSpacing;
            },
            onLayoutEnd: () => {
                if (largeGraphMode) {
                    graph.getEdges().forEach((edge) => {
                        if (!edge.oriLabel) return;
                        edge.update({
                            label: this.labelFormatter(edge.oriLabel, labelMaxLength),
                        });
                    });
                }
            },
            tick: () => {
                graph.refreshPositions();
            },
        };

        if (nodeSize) config['nodeSize'] = nodeSize;
        if (collideStrength) config['collideStrength'] = collideStrength;
        if (alpha) config['alpha'] = alpha;
        if (alphaDecay) config['alphaDecay'] = alphaDecay;
        if (alphaMin) config['alphaMin'] = alphaMin;

        return config;
    };

    public bindListener = (graph) => {
        graph.on('keydown', (evt) => {
            const code = evt.key;
            if (!code) {
                return;
            }
            if (code.toLowerCase() === 'shift') {
                shiftKeydown = true;
            } else {
                shiftKeydown = false;
            }
        });
        graph.on('keyup', (evt) => {
            const code = evt.key;
            if (!code) {
                return;
            }
            if (code.toLowerCase() === 'shift') {
                shiftKeydown = false;
            }
        });

        graph.on('node:mouseenter', (evt) => {
            const { item } = evt;
            const model = item.getModel();
            const currentLabel = model.label;
            model.oriFontSize = model.labelCfg.style.fontSize;
            item.update({
                label: model.oriLabel,
            });
            model.oriLabel = currentLabel;
            graph.setItemState(item, 'hover', true);
            item.toFront();
        });

        graph.on('node:mouseleave', (evt) => {
            const { item } = evt;
            const model = item.getModel();
            const currentLabel = model.label;
            item.update({
                label: model.oriLabel,
            });
            model.oriLabel = currentLabel;
            graph.setItemState(item, 'hover', false);
        });

        graph.on('edge:mouseenter', (evt) => {
            const { item } = evt;
            const model = item.getModel();
            const currentLabel = model.label;
            item.update({
                label: model.oriLabel,
            });
            model.oriLabel = currentLabel;
            item.toFront();
            item.getSource().toFront();
            item.getTarget().toFront();
        });

        graph.on('edge:mouseleave', (evt) => {
            const { item } = evt;
            const model = item.getModel();
            const currentLabel = model.label;
            item.update({
                label: model.oriLabel,
            });
            model.oriLabel = currentLabel;
        });
        // click node to show the detail drawer
        graph.on('node:click', (evt) => {
            this.stopLayout();
            if (!shiftKeydown) this.clearFocusItemState(graph);
            else this.clearFocusEdgeState(graph);
            const { item } = evt;

            // highlight the clicked node, it is down by click-select
            graph.setItemState(item, 'focus', true);

            if (!shiftKeydown) {
                // 将相关边也高亮
                const relatedEdges = item.getEdges();
                relatedEdges.forEach((edge) => {
                    graph.setItemState(edge, 'focus', true);
                });
            }
            G6GraphModel.instance.callback(item, ClickType.Node)
        });

        // click edge to show the detail of integrated edge drawer
        graph.on('edge:click', (evt) => {
            this.stopLayout();
            if (!shiftKeydown) this.clearFocusItemState(graph);
            const { item } = evt;
            // highlight the clicked edge
            graph.setItemState(item, 'focus', true);
        });

        // click canvas to cancel all the focus state
        graph.on('canvas:click', (evt) => {
            this.clearFocusItemState(graph);
            console.log(graph.getGroup(), graph.getGroup().getBBox(), graph.getGroup().getCanvasBBox());
            G6GraphModel.instance.callback(null, ClickType.Canvas)
        });
    };


    public manageExpandCollapseArray = (nodeNumber, model, collapseArray, expandArray) => {
        manipulatePosition = { x: model.x, y: model.y };

        // 维护 expandArray，若当前画布节点数高于上限，移出 expandedArray 中非 model 祖先的节点)
        if (nodeNumber > NODE_LIMIT) {
            // 若 keepTags[i] 为 true，则 expandedArray 的第 i 个节点需要被保留
            const keepTags = {};
            const expandLen = expandArray.length;
            // 检查 X 的所有祖先并标记 keepTags
            this.examAncestors(model, expandArray, expandLen, keepTags);
            // 寻找 expandedArray 中第一个 keepTags 不为 true 的点
            let shiftNodeIdx = -1;
            for (let i = 0; i < expandLen; i++) {
                if (!keepTags[i]) {
                    shiftNodeIdx = i;
                    break;
                }
            }
            // 如果有符合条件的节点，将其从 expandedArray 中移除
            if (shiftNodeIdx !== -1) {
                let foundNode = expandArray[shiftNodeIdx];
                if (foundNode.level === 2) {
                    let foundLevel1 = false;
                    // 找到 expandedArray 中 parentId = foundNode.id 且 level = 1 的第一个节点
                    for (let i = 0; i < expandLen; i++) {
                        const eNode = expandArray[i];
                        if (eNode.parentId === foundNode.id && eNode.level === 1) {
                            foundLevel1 = true;
                            foundNode = eNode;
                            expandArray.splice(i, 1);
                            break;
                        }
                    }
                    // 若未找到，则 foundNode 不变, 直接删去 foundNode
                    if (!foundLevel1) expandArray.splice(shiftNodeIdx, 1);
                } else {
                    // 直接删去 foundNode
                    expandArray.splice(shiftNodeIdx, 1);
                }
                // const removedNode = expandedArray.splice(shiftNodeIdx, 1); // splice returns an array
                const idSplits = foundNode.id.split('-');
                let collapseNodeId;
                // 去掉最后一个后缀
                for (let i = 0; i < idSplits.length - 1; i++) {
                    const str = idSplits[i];
                    if (collapseNodeId) collapseNodeId = `${collapseNodeId}-${str}`;
                    else collapseNodeId = str;
                }
                const collapseNode = {
                    id: collapseNodeId,
                    parentId: foundNode.id,
                    level: foundNode.level - 1,
                };
                collapseArray.push(collapseNode);
            }
        }

        const currentNode = {
            id: model.id,
            level: model.level,
            parentId: model.parentId,
        };

        // 加入当前需要展开的节点
        expandArray.push(currentNode);

        this.graph.get('canvas').setCursor('default');
        return { expandArray, collapseArray };
    };

    public cacheNodePositions = (nodes) => {
        const positionMap = {};
        const nodeLength = nodes.length;
        for (let i = 0; i < nodeLength; i++) {
            const node = nodes[i].getModel();
            positionMap[node.id] = {
                x: node.x,
                y: node.y,
                level: node.level,
            };
        }
        return positionMap;
    };

    public processNodesEdges = ( // 定义点边数据
        nodes,
        edges,
        width,
        height,
        largeGraphMode,
        edgeLabelVisible,
        isNewGraph = false,
    ) => {
        if (!nodes || nodes.length === 0) return {};
        const currentNodeMap = {};
        let maxNodeCount = -Infinity;
        const paddingRatio = 0.3;
        const paddingLeft = paddingRatio * width;
        const paddingTop = paddingRatio * height;
        nodes.forEach((node) => {
            node.type = node.level === 0 ? 'real-node' : 'aggregated-node';
            node.isReal = node.level === 0 ? true : false;
            node.label = `${node.label}`;
            node.labelLineNum = undefined;
            node.oriLabel = node.label;
            node.avatar = "/assets/touxiang.png";
            node.label = this.formatText(node.label, labelMaxLength, '...');
            node.degree = 0;
            node.inDegree = 0;
            node.outDegree = 0;
            if (currentNodeMap[node.id]) {
                console.warn('node exists already!', node.id);
                node.id = `${node.id}${Math.random()}`;
            }
            currentNodeMap[node.id] = node;
            if (node.count > maxNodeCount) maxNodeCount = node.count;
            const cachePosition = cachePositions ? cachePositions[node.id] : undefined;
            if (cachePosition) {
                node.x = cachePosition.x;
                node.y = cachePosition.y;
                node.new = false;
            } else {
                node.new = isNewGraph ? false : true;
                if (manipulatePosition && !node.x && !node.y) {
                    node.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
                    node.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
                }
            }
        });

        let maxCount = -Infinity;
        let minCount = Infinity;
        // let maxCount = 0;
        edges.forEach((edge) => {
            // to avoid the dulplicated id to nodes
            if (!edge.id) edge.id = `edge-${uniqueId()}`;
            else if (edge.id.split('-')[0] !== 'edge') edge.id = `edge-${edge.id}`;
            // TODO: delete the following line after the queried data is correct
            if (!currentNodeMap[edge.source] || !currentNodeMap[edge.target]) {
                console.warn('edge source target does not exist', edge.source, edge.target, edge.id);
                return;
            }
            const sourceNode = currentNodeMap[edge.source];
            const targetNode = currentNodeMap[edge.target];

            if (!sourceNode || !targetNode)
                console.warn('source or target is not defined!!!', edge, sourceNode, targetNode);

            // calculate the degree
            sourceNode.degree++;
            targetNode.degree++;
            sourceNode.outDegree++;
            targetNode.inDegree++;

            if (edge.count > maxCount) maxCount = edge.count;
            if (edge.count < minCount) minCount = edge.count;
        });

        nodes.sort(this.descendCompare(NODESIZEMAPPING));
        const maxDegree = nodes[0].degree || 1;

        const descreteNodes = [];
        nodes.forEach((node, i) => {
            // assign the size mapping to the outDegree
            const countRatio = node.count / maxNodeCount;
            const isRealNode = node.level === 0;
            node.size = isRealNode ? DEFAULTNODESIZE : DEFAULTAGGREGATEDNODESIZE;
            node.isReal = isRealNode;
            node.labelCfg = {
                position: 'bottom',
                offset: 5,
                style: {
                    fill: global.node.labelCfg.style.fill,
                    fontSize: 6 + countRatio * 6 || 12,
                    stroke: global.node.labelCfg.style.stroke,
                    lineWidth: 3,
                },
            };

            if (!node.degree) {
                descreteNodes.push(node);
            }
        });

        const countRange = maxCount - minCount;
        const minEdgeSize = 1;
        const maxEdgeSize = 7;
        const edgeSizeRange = maxEdgeSize - minEdgeSize;
        edges.forEach((edge) => {
            // set edges' style
            const targetNode = currentNodeMap[edge.target];

            const size = ((edge.count - minCount) / countRange) * edgeSizeRange + minEdgeSize || 1;
            edge.size = size;

            const arrowWidth = Math.max(size / 2 + 2, 3);
            const arrowLength = 10;
            const arrowBeging = targetNode.size + arrowLength;
            let arrowPath = `M ${arrowBeging},0 L ${arrowBeging + arrowLength},-${arrowWidth} L ${arrowBeging + arrowLength
                },${arrowWidth} Z`;
            let d = targetNode.size / 2 + arrowLength;
            if (edge.source === edge.target) {
                edge.type = 'loop';
                arrowPath = undefined;
            }
            const sourceNode = currentNodeMap[edge.source];
            const isRealEdge = targetNode.isReal && sourceNode.isReal;
            edge.isReal = isRealEdge;
            const stroke = isRealEdge ? global.edge.style.realEdgeStroke : global.edge.style.stroke;
            const opacity = isRealEdge
                ? global.edge.style.realEdgeOpacity
                : global.edge.style.strokeOpacity;
            const dash = Math.max(size, 2);
            const lineDash = isRealEdge ? undefined : [dash, dash];
            edge.style = {
                stroke,
                strokeOpacity: opacity,
                cursor: 'pointer',
                lineAppendWidth: Math.max(edge.size || 5, 5),
                fillOpacity: 1,
                lineDash,
                endArrow: arrowPath
                    ? {
                        path: arrowPath,
                        d,
                        fill: stroke,
                        strokeOpacity: 0,
                    }
                    : false,
            };
            edge.labelCfg = {
                autoRotate: true,
                style: {
                    stroke: global.edge.labelCfg.style.stroke,
                    fill: global.edge.labelCfg.style.fill,
                    lineWidth: 4,
                    fontSize: 12,
                    lineAppendWidth: 10,
                    opacity: 1,
                },
            };
            if (!edge.oriLabel) edge.oriLabel = edge.label;
            if (largeGraphMode || !edgeLabelVisible) edge.label = '';
            else {
                edge.label = this.labelFormatter(edge.label, labelMaxLength);
            }

            // arrange the other nodes around the hub
            const sourceDis = sourceNode.size / 2 + 20;
            const targetDis = targetNode.size / 2 + 20;
            if (sourceNode.x && !targetNode.x) {
                targetNode.x = sourceNode.x + sourceDis * Math.cos(Math.random() * Math.PI * 2);
            }
            if (sourceNode.y && !targetNode.y) {
                targetNode.y = sourceNode.y + sourceDis * Math.sin(Math.random() * Math.PI * 2);
            }
            if (targetNode.x && !sourceNode.x) {
                sourceNode.x = targetNode.x + targetDis * Math.cos(Math.random() * Math.PI * 2);
            }
            if (targetNode.y && !sourceNode.y) {
                sourceNode.y = targetNode.y + targetDis * Math.sin(Math.random() * Math.PI * 2);
            }

            if (!sourceNode.x && !sourceNode.y && manipulatePosition) {
                sourceNode.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
                sourceNode.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
            }
            if (!targetNode.x && !targetNode.y && manipulatePosition) {
                targetNode.x = manipulatePosition.x + 30 * Math.cos(Math.random() * Math.PI * 2);
                targetNode.y = manipulatePosition.y + 30 * Math.sin(Math.random() * Math.PI * 2);
            }
        });

        descreteNodeCenter = {
            x: width - paddingLeft,
            y: height - paddingTop,
        };
        descreteNodes.forEach((node) => {
            if (!node.x && !node.y) {
                node.x = descreteNodeCenter.x + 30 * Math.cos(Math.random() * Math.PI * 2);
                node.y = descreteNodeCenter.y + 30 * Math.sin(Math.random() * Math.PI * 2);
            }
        });

        G6.Util.processParallelEdges(edges, 12.5, 'custom-quadratic', 'custom-line');
        return {
            maxDegree,
            edges,
        };
    };

    public hideItems = (graph) => {
        hiddenItemIds.forEach((id) => {
            graph.hideItem(id);
        });
    };

    public showItems = (graph) => {
        graph.getNodes().forEach((node) => {
            if (!node.isVisible()) graph.showItem(node);
        });
        graph.getEdges().forEach((edge) => {
            if (!edge.isVisible()) edge.showItem(edge);
        });
        hiddenItemIds = [];
    };

    public handleRefreshGraph = (
        graph,
        graphData,
        width,
        height,
        largeGraphMode,
        edgeLabelVisible,
        isNewGraph,
    ) => {
        if (!graphData || !graph) return;
        this.clearFocusItemState(graph);
        // reset the filtering
        graph.getNodes().forEach((node) => {
            if (!node.isVisible()) node.show();
        });
        graph.getEdges().forEach((edge) => {
            if (!edge.isVisible()) edge.show();
        });

        let nodes = [],
            edges = [];
        nodes = graphData.nodes;
        const processRes = this.processNodesEdges(
            nodes,
            graphData.edges || [],
            width,
            height,
            largeGraphMode,
            edgeLabelVisible,
            isNewGraph,
        );

        edges = processRes.edges;

        graph.changeData({ nodes, edges });

        this.hideItems(graph);
        graph.getNodes().forEach((node) => {
            node.toFront();
        });

        // layout.instance.stop();
        // force 需要使用不同 id 的对象才能进行全新的布局，否则会使用原来的引用。因此复制一份节点和边作为 force 的布局数据
        layout.instance.init({
            nodes: graphData.nodes,
            edges,
        });

        layout.instance.minMovement = 0.0001;
        // layout.instance.getCenter = d => {
        // 	const cachePosition = cachePositions[d.id];
        // 	if (!cachePosition && (d.x || d.y)) return [d.x, d.y, 10];
        // 	else if (cachePosition) return [cachePosition.x, cachePosition.y, 10];
        // 	return [width / 2, height / 2, 10];
        // }
        layout.instance.getMass = (d) => {
            const cachePosition = cachePositions[d.id];
            if (cachePosition) return 5;
            return 1;
        };
        layout.instance.execute();
        return { nodes, edges };
    };

    public getMixedGraph = (
        aggregatedData,
        originData,
        nodeMap,
        aggregatedNodeMap,
        expandArray,
        collapseArray,
    ) => {
        let nodes = [],
            edges = [];

        const expandMap = {},
            collapseMap = {};
        expandArray.forEach((expandModel) => {
            expandMap[expandModel.id] = true;
        });
        collapseArray.forEach((collapseModel) => {
            collapseMap[collapseModel.id] = true;
        });

        aggregatedData.clusters.forEach((cluster, i) => {
            if (expandMap[cluster.id]) {
                nodes = nodes.concat(cluster.nodes);
                aggregatedNodeMap[cluster.id].expanded = true;
            } else {
                nodes.push(aggregatedNodeMap[cluster.id]);
                aggregatedNodeMap[cluster.id].expanded = false;
            }
        });
        originData.edges.forEach((edge) => {
            const isSourceInExpandArray = expandMap[nodeMap[edge.source].clusterId];
            const isTargetInExpandArray = expandMap[nodeMap[edge.target].clusterId];
            if (isSourceInExpandArray && isTargetInExpandArray) {
                edges.push(edge);
            } else if (isSourceInExpandArray) {
                const targetClusterId = nodeMap[edge.target].clusterId;
                const vedge = {
                    source: edge.source,
                    target: targetClusterId,
                    id: `edge-${uniqueId()}`,
                    label: '',
                };
                edges.push(vedge);
            } else if (isTargetInExpandArray) {
                const sourceClusterId = nodeMap[edge.source].clusterId;
                const vedge = {
                    target: edge.target,
                    source: sourceClusterId,
                    id: `edge-${uniqueId()}`,
                    label: '',
                };
                edges.push(vedge);
            }
        });
        aggregatedData.clusterEdges.forEach((edge) => {
            if (expandMap[edge.source] || expandMap[edge.target]) return;
            else edges.push(edge);
        });
        return { nodes, edges };
    };

    public getNeighborMixedGraph = (
        centerNodeModel,
        step,
        originData,
        clusteredData,
        currentData,
        nodeMap,
        aggregatedNodeMap,
        maxNeighborNumPerNode = 5,
    ) => {
        // update the manipulate position for center gravity of the new nodes
        manipulatePosition = { x: centerNodeModel.x, y: centerNodeModel.y };

        // the neighborSubGraph does not include the centerNodeModel. the elements are all generated new nodes and edges
        const neighborSubGraph = this.generateNeighbors(centerNodeModel, step, maxNeighborNumPerNode);
        // update the origin data
        originData.nodes = originData.nodes.concat(neighborSubGraph.nodes);
        originData.edges = originData.edges.concat(neighborSubGraph.edges);
        // update the origin nodeMap
        neighborSubGraph.nodes.forEach((node) => {
            nodeMap[node.id] = node;
        });
        // update the clusteredData
        const clusterId = centerNodeModel.clusterId;
        clusteredData.clusters.forEach((cluster) => {
            if (cluster.id !== clusterId) return;
            cluster.nodes = cluster.nodes.concat(neighborSubGraph.nodes);
            cluster.sumTot += neighborSubGraph.edges.length;
        });
        // update the count
        aggregatedNodeMap[clusterId].count += neighborSubGraph.nodes.length;

        currentData.nodes = currentData.nodes.concat(neighborSubGraph.nodes);
        currentData.edges = currentData.edges.concat(neighborSubGraph.edges);
        return currentData;
    };

    public generateNeighbors = (centerNodeModel, step, maxNeighborNumPerNode = 5) => {
        if (step <= 0) return undefined;
        let nodes = [],
            edges = [];
        const clusterId = centerNodeModel.clusterId;
        const centerId = centerNodeModel.id;
        const neighborNum = Math.ceil(Math.random() * maxNeighborNumPerNode);
        console.log(neighborNum)
        const newGener = () => {
            const neighborNode = {
                id: uniqueId(),
                clusterId,
                level: 0,
                colorSet: centerNodeModel.colorSet,
                label: '词条名称'
            };
            nodes.push(neighborNode);
            const dire = Math.random() > 0.5;
            const source = dire ? centerId : neighborNode.id;
            const target = dire ? neighborNode.id : centerId;
            const neighborEdge = {
                id: uniqueId(),
                source,
                target,
                label: `关系`,
            };
            edges.push(neighborEdge);
            const subNeighbors = this.generateNeighbors(neighborNode, step - 1, maxNeighborNumPerNode);
            console.log(subNeighbors)
            if (subNeighbors) {
                nodes = nodes.concat(subNeighbors.nodes);
                edges = edges.concat(subNeighbors.edges);
            }
        }
        switch (step) {
            case g6OptionType.AddOne: // 添加一个实体
                newGener()
                break;

            default:
                break;
        }
        // for (let i = 0; i < neighborNum; i++) {
        //     newGener()
        // }
        return { nodes, edges };
    };



    public examAncestors = (model, expandedArray, length, keepTags) => {
        for (let i = 0; i < length; i++) {
            const expandedNode = expandedArray[i];
            if (!keepTags[i] && model.parentId === expandedNode.id) {
                keepTags[i] = true; // 需要被保留
                this.examAncestors(expandedNode, expandedArray, length, keepTags);
                break;
            }
        }
    };

    init() {
        fetch('https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json')
            .then((res) => res.json())
            .then(() => {
                const data: GraphDataInfo = graphData();
                const getNode = (id: string): GraphDataNode[] => data.nodes.filter(d => d.id === id);
                const getEdge = (id: string): GraphDataEdge[] => data.edges.filter(d => d.id === id);
                const container = document.getElementById('container');
                const descriptionDiv = document.createElement('div');
                container.appendChild(descriptionDiv);

                container.style.backgroundColor = '#2b2f33';

                CANVAS_WIDTH = container.scrollWidth;
                CANVAS_HEIGHT = (container.scrollHeight || 500) - 30;

                nodeMap = {};
                const clusteredData = louvain(data, false, 'weight');
                const aggregatedData = { nodes: [], edges: [] };
                clusteredData.clusters.forEach((cluster, i) => {
                    cluster.nodes.forEach((node) => {
                        const list = getNode(node.id) || []
                        node.level = 0;
                        node.label = list[0]?.label || '未命名';
                        node.type = '';
                        node.colorSet = colorSets[i];
                        nodeMap[node.id] = node;
                    });
                    const cnode = {
                        id: cluster.id,
                        type: 'aggregated-node',
                        count: cluster.nodes.length,
                        level: 1,
                        label: cluster.id,
                        colorSet: colorSets[i],
                        idx: i,
                    };
                    aggregatedNodeMap[cluster.id] = cnode;
                    aggregatedData.nodes.push(cnode);
                });
                clusteredData.clusterEdges.forEach((clusterEdge) => {
                    const cedge = {
                        ...clusterEdge,
                        size: Math.log(clusterEdge.count),
                        label: '',
                        id: `edge-${uniqueId()}`,
                    } as any;
                    if (cedge.source === cedge.target) {
                        cedge.type = 'loop';
                        cedge.loopCfg = {
                            dist: 20,
                        };
                    } else cedge.type = 'line';
                    aggregatedData.edges.push(cedge);
                });

                data.edges.forEach((edge) => {
                    // edge.label = `${edge.source}-${edge.target}`;
                    edge.label = `${edge.label}`;
                    edge.id = `edge-${uniqueId()}`;
                });

                console.log(clusteredData)
                currentUnproccessedData = aggregatedData;

                const { edges: processedEdges } = this.processNodesEdges(
                    currentUnproccessedData.nodes,
                    currentUnproccessedData.edges,
                    CANVAS_WIDTH,
                    CANVAS_HEIGHT,
                    largeGraphMode,
                    true,
                    true,
                );

                const contextMenu = new G6.Menu({
                    shouldBegin(evt) {
                        if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) return true;
                        if (evt.item) return true;
                        return false;
                    },
                    getContent(evt) {
                        open = false;
                        const { item } = evt;
                        if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
                            return `<ul>
              <li id='show'>显示所有隐藏项</li>
              <li id='collapseAll'>折叠所有群集</li>
            </ul>`;
                        } else if (!item) return;
                        const itemType = item.getType();
                        const model = item.getModel();
                        if (itemType && model) {
                            if (itemType === 'node') {
                                if (model.level !== 0) {
                                    return `<ul>
                  <li id='expand'>展开群集</li>
                  <li id='hide'>隐藏节点</li>
                </ul>`;
                                } else {
                                    return `<ul>
                  <li id='collapse'>折叠群集</li>
                  <li id='neighbor-${g6OptionType.AddOne}'>添加一个关系实体</li>
                  <li id='hide'>删除实体</li>
                </ul>`;
                                }
                            } else {
                                return `<ul>
                <li id='hide'>隐藏边</li>
              </ul>`;
                            }
                        }
                    },
                    handleMenuClick: (target, item) => {
                        const model = item && item.getModel();
                        const liIdStrs = target.id.split('-');
                        let mixedGraphData;
                        switch (liIdStrs[0]) {
                            case 'hide':
                                this.graph.hideItem(item);
                                hiddenItemIds.push(model.id);
                                break;
                            case 'expand':
                                const newArray = this.manageExpandCollapseArray(
                                    this.graph.getNodes().length,
                                    model,
                                    collapseArray,
                                    expandArray,
                                );
                                expandArray = newArray.expandArray;
                                collapseArray = newArray.collapseArray;
                                mixedGraphData = this.getMixedGraph(
                                    clusteredData,
                                    data,
                                    nodeMap,
                                    aggregatedNodeMap,
                                    expandArray,
                                    collapseArray,
                                );
                                break;
                            case 'collapse':
                                const aggregatedNode = aggregatedNodeMap[model.clusterId];
                                manipulatePosition = { x: aggregatedNode.x, y: aggregatedNode.y };
                                collapseArray.push(aggregatedNode);
                                for (let i = 0; i < expandArray.length; i++) {
                                    if (expandArray[i].id === model.clusterId) {
                                        expandArray.splice(i, 1);
                                        break;
                                    }
                                }
                                mixedGraphData = this.getMixedGraph(
                                    clusteredData,
                                    data,
                                    nodeMap,
                                    aggregatedNodeMap,
                                    expandArray,
                                    collapseArray,
                                );
                                break;
                            case 'collapseAll':
                                expandArray = [];
                                collapseArray = [];
                                mixedGraphData = this.getMixedGraph(
                                    clusteredData,
                                    data,
                                    nodeMap,
                                    aggregatedNodeMap,
                                    expandArray,
                                    collapseArray,
                                );
                                break;
                            case 'neighbor':
                                const expandNeighborSteps = parseInt(liIdStrs[1]);
                                mixedGraphData = this.getNeighborMixedGraph(
                                    model,
                                    expandNeighborSteps,
                                    data,
                                    clusteredData,
                                    currentUnproccessedData,
                                    nodeMap,
                                    aggregatedNodeMap,
                                    10,
                                );
                                break;
                            case 'show':
                                this.showItems(this.graph);
                                break;
                            default:
                                break;
                        }
                        if (mixedGraphData) {
                            cachePositions = this.cacheNodePositions(this.graph.getNodes());
                            currentUnproccessedData = mixedGraphData;
                            this.handleRefreshGraph(
                                this.graph,
                                currentUnproccessedData,
                                CANVAS_WIDTH,
                                CANVAS_HEIGHT,
                                largeGraphMode,
                                true,
                                false,
                            );
                        }
                    },
                    // offsetX and offsetY include the padding of the parent container
                    // 需要加上父级容器的 padding-left 16 与自身偏移量 10
                    offsetX: 16 + 10,
                    // 需要加上父级容器的 padding-top 24 、画布兄弟元素高度、与自身偏移量 10
                    offsetY: 0,
                    // the types of items that allow the menu show up
                    // 在哪些类型的元素上响应
                    itemTypes: ['node', 'edge', 'canvas'],
                });

                this.graph = new G6.Graph({
                    container: 'container',
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    linkCenter: true,
                    minZoom: 0.1,
                    groupByTypes: false,
                    modes: {
                        default: [
                            {
                                type: 'drag-canvas',
                                enableOptimize: false,
                            },
                            {
                                type: 'zoom-canvas',
                                enableOptimize: false,
                                optimizeZoom: 0.01,
                            },
                            'drag-node',
                            'shortcuts-call',
                        ],
                        lassoSelect: [
                            {
                                type: 'zoom-canvas',
                                enableOptimize: false,
                                optimizeZoom: 0.01,
                            },
                            {
                                type: 'lasso-select',
                                selectedState: 'focus',
                                trigger: 'drag',
                            },
                        ],
                        fisheyeMode: [],
                    },
                    defaultNode: {
                        type: 'aggregated-node',
                        size: DEFAULTNODESIZE,
                    },
                    plugins: [contextMenu],
                });

                this.graph.get('canvas').set('localRefresh', false);

                const layoutConfig: any = this.getForceLayoutConfig(this.graph, largeGraphMode);
                layoutConfig.center = [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2];
                layout.instance = new G6.Layout['gForce'](layoutConfig);
                layout.instance.init({
                    nodes: currentUnproccessedData.nodes,
                    edges: processedEdges,
                });
                layout.instance.execute();

                this.bindListener(this.graph);
                this.graph.data({ nodes: aggregatedData.nodes, edges: processedEdges });
                this.graph.render();
            });

        if (typeof window !== 'undefined')
            window.onresize = () => {
                if (!this.graph || this.graph.get('destroyed')) return;
                const container = document.getElementById('container');
                if (!container) return;
                this.graph.changeSize(container.scrollWidth, container.scrollHeight - 30);
            };
    }
}