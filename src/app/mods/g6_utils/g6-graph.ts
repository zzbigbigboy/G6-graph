import G6 from '@antv/g6';
const { labelPropagation, louvain, findShortestPath } = G6.Algorithm;
const { uniqueId } = G6.Util;
import { isNumber, isArray } from '@antv/util';
import G6ClassModel from './g6';
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

export default class G6GraphModel extends G6ClassModel {
    private static _instance: G6GraphModel;
    callback: any = (data: any) => { };

    public static get instance(): G6GraphModel {
        if (!this._instance) {
            this._instance = new G6GraphModel();
        }
        return this._instance;
    }

    public initGraph() {
        this.CustomQuadraticEdge()
        this.CustomLine()
        this.CustomSuperNode()
        this.CustomRealNode()
    }

    public CustomSuperNode() {
        // Custom super node
        G6.registerNode(
            'aggregated-node',
            {
                draw(cfg, group) {
                    let width = 53,
                        height = 27;
                    const style = cfg.style || {};
                    const colorSet = cfg.colorSet || colorSets[0];

                    // halo for hover
                    group.addShape('rect', {
                        attrs: {
                            x: -width * 0.55,
                            y: -height * 0.6,
                            width: width * 1.1,
                            height: height * 1.2,
                            fill: colorSet.mainFill,
                            opacity: 0.9,
                            lineWidth: 0,
                            radius: (height / 2 || 13) * 1.2,
                        },
                        name: 'halo-shape',
                        visible: false,
                    });

                    // focus stroke for hover
                    group.addShape('rect', {
                        attrs: {
                            x: -width * 0.55,
                            y: -height * 0.6,
                            width: width * 1.1,
                            height: height * 1.2,
                            fill: colorSet.mainFill, // '#3B4043',
                            stroke: '#AAB7C4',
                            lineWidth: 1,
                            lineOpacty: 0.85,
                            radius: (height / 2 || 13) * 1.2,
                        },
                        name: 'stroke-shape',
                        visible: false,
                    });

                    const keyShape = group.addShape('rect', {
                        attrs: {
                            ...style,
                            x: -width / 2,
                            y: -height / 2,
                            width,
                            height,
                            fill: colorSet.mainFill, // || '#3B4043',
                            stroke: colorSet.mainStroke,
                            lineWidth: 2,
                            cursor: 'pointer',
                            radius: height / 2 || 13,
                            lineDash: [2, 2],
                        },
                        name: 'aggregated-node-keyShape',
                    });

                    let labelStyle = {};
                    if (cfg.labelCfg) {
                        labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
                    }
                    group.addShape('text', {
                        attrs: {
                            text: `${cfg.count}`,
                            x: 0,
                            y: 0,
                            textAlign: 'center',
                            textBaseline: 'middle',
                            cursor: 'pointer',
                            fontSize: 12,
                            fill: '#fff',
                            opacity: 0.85,
                            fontWeight: 400,
                        },
                        name: 'count-shape',
                        className: 'count-shape',
                        draggable: true,
                    });

                    // tag for new node
                    if (cfg.new) {
                        group.addShape('circle', {
                            attrs: {
                                x: width / 2 - 3,
                                y: -height / 2 + 3,
                                r: 4,
                                fill: '#6DD400',
                                lineWidth: 0.5,
                                stroke: '#FFFFFF',
                            },
                            name: 'typeNode-tag-circle',
                        });
                    }
                    return keyShape;
                },
                setState: (name, value, item) => {
                    const group = item.get('group');
                    if (name === 'layoutEnd' && value) {
                        const labelShape = group.find((e) => e.get('name') === 'text-shape');
                        if (labelShape) labelShape.set('visible', true);
                    } else if (name === 'hover') {
                        if (item.hasState('focus')) {
                            return;
                        }
                        const halo = group.find((e) => e.get('name') === 'halo-shape');
                        const keyShape = item.getKeyShape();
                        const colorSet = item.getModel().colorSet || colorSets[0];
                        if (value) {
                            halo && halo.show();
                            keyShape.attr('fill', colorSet.activeFill);
                        } else {
                            halo && halo.hide();
                            keyShape.attr('fill', colorSet.mainFill);
                        }
                    } else if (name === 'focus') {
                        const stroke = group.find((e) => e.get('name') === 'stroke-shape');
                        const keyShape = item.getKeyShape();
                        const colorSet = item.getModel().colorSet || colorSets[0];
                        if (value) {
                            stroke && stroke.show();
                            keyShape.attr('fill', colorSet.selectedFill);
                        } else {
                            stroke && stroke.hide();
                            keyShape.attr('fill', colorSet.mainFill);
                        }
                    }
                },
                update: undefined,
            },
            'single-node',
        );
    }

    public CustomRealNode() {
        // Custom real node
        G6.registerNode(
            'real-node',
            {
                draw(cfg: any, group) {
                    let r = 30;
                    if (isNumber(cfg.size)) {
                        r = cfg.size / 2;
                    } else if (isArray(cfg.size)) {
                        r = cfg.size[0] / 2;
                    }
                    const style = cfg.style || {};
                    const colorSet = cfg.colorSet || colorSets[0];

                    // halo for hover
                    group.addShape('circle', {
                        attrs: {
                            x: 0,
                            y: 0,
                            r: r + 5,
                            fill: style.fill || colorSet.mainFill || '#2B384E',
                            opacity: 0.9,
                            lineWidth: 0,
                        },
                        name: 'halo-shape',
                        visible: false,
                    });

                    // focus stroke for hover
                    group.addShape('circle', {
                        attrs: {
                            x: 0,
                            y: 0,
                            r: r + 5,
                            fill: style.fill || colorSet.mainFill || '#2B384E',
                            stroke: '#fff',
                            strokeOpacity: 0.85,
                            lineWidth: 1,
                        },
                        name: 'stroke-shape',
                        visible: false,
                    });

                    const keyShape = group.addShape('circle', {
                        attrs: {
                            ...style,
                            x: 0,
                            y: 0,
                            r,
                            fill: colorSet.mainFill,
                            stroke: colorSet.mainStroke,
                            lineWidth: 2,
                            cursor: 'pointer',
                        },
                        name: 'aggregated-node-keyShape',
                    });
                    
                    // node avatar
                    if (cfg.avatar) {
                        group.addShape('image', {
                            attrs: {
                                x: -9,
                                y: -9,
                                r: 10,
                                cursor: 'pointer',
                                img: cfg.avatar,
                                width: 18,
                                height: 18,
                            },
                            draggable: true,
                            capture: true,
                            name: 'circle-image',
                            zIndex: -1,
                        });
                    }

                    let labelStyle = {};
                    if (cfg.labelCfg) {
                        labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
                    }
                    if (cfg.label) {
                        const text = cfg.label;
                        let labelStyle = {} as any;
                        let refY = 0;
                        if (cfg.labelCfg) {
                            labelStyle = Object.assign(labelStyle, cfg.labelCfg.style);
                            refY += cfg.labelCfg.refY || 0;
                        }
                        let offsetY = 0;
                        const fontSize = labelStyle.fontSize < 8 ? 8 : labelStyle.fontSize;
                        const lineNum: any = cfg.labelLineNum || 1;
                        offsetY = lineNum * (fontSize || 12);
                        group.addShape('text', {
                            attrs: {
                                text,
                                x: 0,
                                y: r + refY + offsetY + 5,
                                textAlign: 'center',
                                textBaseLine: 'alphabetic',
                                cursor: 'pointer',
                                fontSize,
                                fill: '#fff',
                                opacity: 0.85,
                                fontWeight: 400,
                                stroke: global.edge.labelCfg.style.stroke,
                            },
                            name: 'text-shape',
                            className: 'text-shape',
                        });
                    }

                    // tag for new node
                    if (cfg.new) {
                        group.addShape('circle', {
                            attrs: {
                                x: r - 3,
                                y: -r + 3,
                                r: 4,
                                fill: '#6DD400',
                                lineWidth: 0.5,
                                stroke: '#FFFFFF',
                            },
                            name: 'typeNode-tag-circle',
                        });
                    }

                    return keyShape;
                },
                setState: (name, value, item) => {
                    const group = item.get('group');
                    if (name === 'layoutEnd' && value) {
                        const labelShape = group.find((e) => e.get('name') === 'text-shape');
                        if (labelShape) labelShape.set('visible', true);
                    } else if (name === 'hover') {
                        if (item.hasState('focus')) {
                            return;
                        }
                        const halo = group.find((e) => e.get('name') === 'halo-shape');
                        const keyShape = item.getKeyShape();
                        const colorSet = item.getModel().colorSet || colorSets[0];
                        if (value) {
                            halo && halo.show();
                            keyShape.attr('fill', colorSet.activeFill);
                        } else {
                            halo && halo.hide();
                            keyShape.attr('fill', colorSet.mainFill);
                        }
                    } else if (name === 'focus') {
                        const stroke = group.find((e) => e.get('name') === 'stroke-shape');
                        const label = group.find((e) => e.get('name') === 'text-shape');
                        const keyShape = item.getKeyShape();
                        const colorSet = item.getModel().colorSet || colorSets[0];
                        if (value) {
                            stroke && stroke.show();
                            keyShape.attr('fill', colorSet.selectedFill);
                            label && label.attr('fontWeight', 800);
                        } else {
                            stroke && stroke.hide();
                            keyShape.attr('fill', colorSet.mainFill); // '#2B384E'
                            label && label.attr('fontWeight', 400);
                        }
                    }
                },
                update: undefined,
            },
            'aggregated-node',
        ); // 这样可以继承 aggregated-node 的 setState
    }

    public getExtractNodeMixedGraph = (
        extractNodeData,
        originData,
        nodeMap,
        aggregatedNodeMap,
        currentUnproccessedData,
    ) => {
        const extractNodeId = extractNodeData.id;
        // const extractNodeClusterId = extractNodeData.clusterId;
        // push to the current rendering data
        currentUnproccessedData.nodes.push(extractNodeData);
        // update the count of aggregatedNodeMap, when to revert?
        // aggregatedNodeMap[extractNodeClusterId].count --;

        // extract the related edges
        originData.edges.forEach((edge) => {
            if (edge.source === extractNodeId) {
                const targetClusterId = nodeMap[edge.target].clusterId;
                if (!aggregatedNodeMap[targetClusterId].expanded) {
                    // did not expand, create an virtual edge fromt he extract node to the cluster
                    currentUnproccessedData.edges.push({
                        id: uniqueId(),
                        source: extractNodeId,
                        target: targetClusterId,
                    });
                } else {
                    // if the cluster is already expanded, push the origin edge
                    currentUnproccessedData.edges.push(edge);
                }
            } else if (edge.target === extractNodeId) {
                const sourceClusterId = nodeMap[edge.source].clusterId;
                if (!aggregatedNodeMap[sourceClusterId].expanded) {
                    // did not expand, create an virtual edge fromt he extract node to the cluster
                    currentUnproccessedData.edges.push({
                        id: uniqueId(),
                        target: extractNodeId,
                        source: sourceClusterId,
                    });
                } else {
                    // if the cluster is already expanded, push the origin edge
                    currentUnproccessedData.edges.push(edge);
                }
            }
        });
        return currentUnproccessedData;
    };

    public CustomQuadraticEdge() {
        // Custom the quadratic edge for multiple edges between one node pair
        G6.registerEdge(
            'custom-quadratic',
            {
                setState: (name, value, item) => {
                    const group = item.get('group');
                    const model = item.getModel();
                    if (name === 'focus') {
                        const back = group.find((ele) => ele.get('name') === 'back-line');
                        if (back) {
                            back.stopAnimate();
                            back.remove();
                            back.destroy();
                        }
                        const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
                        const arrow: any = model.style.endArrow;
                        if (value) {
                            if (keyShape.cfg.animation) {
                                keyShape.stopAnimate(true);
                            }
                            keyShape.attr({
                                strokeOpacity: animateOpacity,
                                opacity: animateOpacity,
                                stroke: '#fff',
                                endArrow: {
                                    ...arrow,
                                    stroke: '#fff',
                                    fill: '#fff',
                                },
                            });
                            if (model.isReal) {
                                const { lineWidth, path, endArrow, stroke } = keyShape.attr();
                                const back = group.addShape('path', {
                                    attrs: {
                                        lineWidth,
                                        path,
                                        stroke,
                                        endArrow,
                                        opacity: animateBackOpacity,
                                    },
                                    name: 'back-line',
                                });
                                back.toBack();
                                const length = keyShape.getTotalLength();
                                keyShape.animate(
                                    (ratio) => {
                                        // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                                        const startLen = ratio * length;
                                        // Calculate the lineDash
                                        const cfg = {
                                            lineDash: [startLen, length - startLen],
                                        };
                                        return cfg;
                                    },
                                    {
                                        repeat: true, // Whether executes the animation repeatly
                                        duration, // the duration for executing once
                                    },
                                );
                            } else {
                                let index = 0;
                                const lineDash = keyShape.attr('lineDash');
                                const totalLength = lineDash[0] + lineDash[1];
                                keyShape.animate(
                                    () => {
                                        index++;
                                        if (index > totalLength) {
                                            index = 0;
                                        }
                                        const res = {
                                            lineDash,
                                            lineDashOffset: -index,
                                        };
                                        // returns the modified configurations here, lineDash and lineDashOffset here
                                        return res;
                                    },
                                    {
                                        repeat: true, // whether executes the animation repeatly
                                        duration, // the duration for executing once
                                    },
                                );
                            }
                        } else {
                            keyShape.stopAnimate();
                            const stroke = '#acaeaf';
                            const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                            keyShape.attr({
                                stroke,
                                strokeOpacity: opacity,
                                opacity,
                                endArrow: {
                                    ...arrow,
                                    stroke,
                                    fill: stroke,
                                },
                            });
                        }
                    }
                },
            },
            'quadratic',
        );
    }

    public CustomLine() {
        // Custom the line edge for single edge between one node pair
        G6.registerEdge(
            'custom-line',
            {
                setState: (name, value, item) => {
                    const group = item.get('group');
                    const model = item.getModel();
                    if (name === 'focus') {
                        const keyShape = group.find((ele) => ele.get('name') === 'edge-shape');
                        const back = group.find((ele) => ele.get('name') === 'back-line');
                        if (back) {
                            back.stopAnimate();
                            back.remove();
                            back.destroy();
                        }
                        const arrow: any = model.style.endArrow;
                        if (value) {
                            if (keyShape.cfg.animation) {
                                keyShape.stopAnimate(true);
                            }
                            keyShape.attr({
                                strokeOpacity: animateOpacity,
                                opacity: animateOpacity,
                                stroke: '#fff',
                                endArrow: {
                                    ...arrow,
                                    stroke: '#fff',
                                    fill: '#fff',
                                },
                            });
                            if (model.isReal) {
                                const { path, stroke, lineWidth } = keyShape.attr();
                                const back = group.addShape('path', {
                                    attrs: {
                                        path,
                                        stroke,
                                        lineWidth,
                                        opacity: animateBackOpacity,
                                    },
                                    name: 'back-line',
                                });
                                back.toBack();
                                const length = keyShape.getTotalLength();
                                keyShape.animate(
                                    (ratio) => {
                                        // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                                        const startLen = ratio * length;
                                        // Calculate the lineDash
                                        const cfg = {
                                            lineDash: [startLen, length - startLen],
                                        };
                                        return cfg;
                                    },
                                    {
                                        repeat: true, // Whether executes the animation repeatly
                                        duration, // the duration for executing once
                                    },
                                );
                            } else {
                                const lineDash = keyShape.attr('lineDash');
                                const totalLength = lineDash[0] + lineDash[1];
                                let index = 0;
                                keyShape.animate(
                                    () => {
                                        index++;
                                        if (index > totalLength) {
                                            index = 0;
                                        }
                                        const res = {
                                            lineDash,
                                            lineDashOffset: -index,
                                        };
                                        // returns the modified configurations here, lineDash and lineDashOffset here
                                        return res;
                                    },
                                    {
                                        repeat: true, // whether executes the animation repeatly
                                        duration, // the duration for executing once
                                    },
                                );
                            }
                        } else {
                            keyShape.stopAnimate();
                            const stroke = '#acaeaf';
                            const opacity = model.isReal ? realEdgeOpacity : virtualEdgeOpacity;
                            keyShape.attr({
                                stroke,
                                strokeOpacity: opacity,
                                opacity: opacity,
                                endArrow: {
                                    ...arrow,
                                    stroke,
                                    fill: stroke,
                                },
                            });
                        }
                    }
                },
            },
            'single-edge',
        );
    }
}