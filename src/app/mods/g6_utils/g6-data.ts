export enum g6OptionType {
    AddOne = 1
}

export const g6Data = {
    // 点集
    nodes: [
        {
            id: 'node1', // String，该节点存在则必须，节点的唯一标识
            x: 100, // Number，可选，节点位置的 x 值
            y: 200, // Number，可选，节点位置的 y 值
        },
        {
            id: 'node2', // String，该节点存在则必须，节点的唯一标识
            x: 300, // Number，可选，节点位置的 x 值
            y: 200, // Number，可选，节点位置的 y 值
        },
    ],
    // 边集
    edges: [
        {
            source: 'node1', // String，必须，起始点 id
            target: 'node2', // String，必须，目标点 id
        },
    ],
};

export const data = {
    "parent": "",
    "name": "毛泽东",
    "center": "60d2395392756ed943492c4b0004cb95",
    "nodes": [
        {
            "uid": "60d2395392756ed943492c4b0004cb95",
            "type": "personages",
            "name": "毛泽东",
            "avatar": ""
        },
        {
            "uid": "fb4faa7effe2b8926b8092c21f9c56f2",
            "type": "personages",
            "name": "江青",
            "avatar": ""
        },
        {
            "uid": "df2945f922ce391522dd60836a5d9933",
            "type": "personages",
            "name": "毛岸青",
            "avatar": ""
        },
        {
            "uid": "342a8757767e788234080f50d1d5f963",
            "type": "personages",
            "name": "毛岸红",
            "avatar": ""
        },
        {
            "uid": "0f8075308b859b68dca435726c0a8926",
            "type": "personages",
            "name": "毛岸龙",
            "avatar": ""
        },
        {
            "uid": "e2f0a915844d8211a975a1567a20584f",
            "type": "personages",
            "name": "毛岸英",
            "avatar": ""
        },
        {
            "uid": "453348fa31eb2c59836e53bfcead6b57",
            "type": "personages",
            "name": "李敏",
            "avatar": ""
        },
        {
            "uid": "2da45efd1c3412c8d120e3815e048af7",
            "type": "personages",
            "name": "李讷",
            "avatar": ""
        },
        {
            "uid": "43c0e9b8886316548fc9bcf60514ae10",
            "type": "personages",
            "name": "毛贻昌",
            "avatar": ""
        },
        {
            "uid": "d7bb9030fab584af2efecae5e37a2458",
            "type": "personages",
            "name": "文七妹",
            "avatar": ""
        },
        {
            "uid": "db09d771d3416e90686c97b18180e048",
            "type": "personages",
            "name": "罗一秀",
            "avatar": ""
        },
        {
            "uid": "fedc46f0b669d3075d1a6b8cfbf4a092",
            "type": "personages",
            "name": "杨开慧",
            "avatar": ""
        },
        {
            "uid": "d2b071100e5d1f3fe5dd11cb8356aa37",
            "type": "personages",
            "name": "贺子珍",
            "avatar": ""
        },
        {
            "uid": "59d6235b2f8c1e47aa236f70dc91469e",
            "type": "personages",
            "name": "毛泽民",
            "avatar": ""
        },
        {
            "uid": "1bc7c5f1f7908a29a5eefe7c9e5c0f71",
            "type": "personages",
            "name": "毛泽覃",
            "avatar": ""
        },
        {
            "uid": "5d68a8b22ea52844cf882e3682a5e152",
            "type": "personages",
            "name": "毛新宇",
            "avatar": ""
        },
        {
            "uid": "e8a084edd2987034633a126e5b63649d",
            "type": "personages",
            "name": "孔令华",
            "avatar": ""
        },
        {
            "uid": "43ecbc7d561b3348c8170e7d4c92b496",
            "type": "personages",
            "name": "毛东东",
            "avatar": ""
        },
        {
            "uid": "dcfe212139b473c33d467855b49b4834",
            "type": "personages",
            "name": "李漱清",
            "avatar": ""
        }
    ],
    "edges": [
        {
            "uid": "24",
            "direction": 0,
            "name": "妻子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "fb4faa7effe2b8926b8092c21f9c56f2",
            "remark": null
        },
        {
            "uid": "25",
            "direction": 0,
            "name": "儿子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "df2945f922ce391522dd60836a5d9933",
            "remark": null
        },
        {
            "uid": "26",
            "direction": 0,
            "name": "儿子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "342a8757767e788234080f50d1d5f963",
            "remark": null
        },
        {
            "uid": "27",
            "direction": 0,
            "name": "儿子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "0f8075308b859b68dca435726c0a8926",
            "remark": null
        },
        {
            "uid": "28",
            "direction": 0,
            "name": "儿子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "e2f0a915844d8211a975a1567a20584f",
            "remark": null
        },
        {
            "uid": "29",
            "direction": 0,
            "name": "女儿",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "453348fa31eb2c59836e53bfcead6b57",
            "remark": null
        },
        {
            "uid": "30",
            "direction": 0,
            "name": "女儿",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "2da45efd1c3412c8d120e3815e048af7",
            "remark": null
        },
        {
            "uid": "31",
            "direction": 0,
            "name": "父亲",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "43c0e9b8886316548fc9bcf60514ae10",
            "remark": null
        },
        {
            "uid": "32",
            "direction": 0,
            "name": "母亲",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "d7bb9030fab584af2efecae5e37a2458",
            "remark": null
        },
        {
            "uid": "33",
            "direction": 0,
            "name": "前妻",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "db09d771d3416e90686c97b18180e048",
            "remark": null
        },
        {
            "uid": "34",
            "direction": 0,
            "name": "前妻",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "fedc46f0b669d3075d1a6b8cfbf4a092",
            "remark": null
        },
        {
            "uid": "35",
            "direction": 0,
            "name": "前妻",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "d2b071100e5d1f3fe5dd11cb8356aa37",
            "remark": null
        },
        {
            "uid": "36",
            "direction": 0,
            "name": "弟弟",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "59d6235b2f8c1e47aa236f70dc91469e",
            "remark": null
        },
        {
            "uid": "37",
            "direction": 0,
            "name": "弟弟",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "1bc7c5f1f7908a29a5eefe7c9e5c0f71",
            "remark": null
        },
        {
            "uid": "38",
            "direction": 0,
            "name": "孙子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "5d68a8b22ea52844cf882e3682a5e152",
            "remark": null
        },
        {
            "uid": "39",
            "direction": 0,
            "name": "女婿",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "e8a084edd2987034633a126e5b63649d",
            "remark": null
        },
        {
            "uid": "40",
            "direction": 0,
            "name": "曾孙子",
            "type": "亲属",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "43ecbc7d561b3348c8170e7d4c92b496",
            "remark": null
        },
        {
            "uid": "41",
            "direction": 0,
            "name": "老师",
            "type": "社会关系",
            "from": "60d2395392756ed943492c4b0004cb95",
            "to": "dcfe212139b473c33d467855b49b4834",
            "remark": null
        }
    ],
    // "nodes": [
    //     {
    //         "id": "Myriel"
    //     },
    //     {
    //         "id": "Napoleon"
    //     },
    //     {
    //         "id": "Mlle.Baptistine"
    //     },
    // ],
    // "edges": [
    //     {
    //         "source": "Napoleon",
    //         "target": "Myriel",
    //         "value": 1
    //     },
    //     {
    //         "source": "Mlle.Baptistine",
    //         "target": "Myriel",
    //         "value": 8
    //     },
    // ]
} as GraphDataInfo;

export interface GraphDataInfo {
    parent: string;
    name: string;
    center: string;
    nodes: GraphDataNode[];
    edges: GraphDataEdge[];
}

export interface GraphDataNode {
    id: string;
    type: string;
    name: string;
    avatar: string;
    label?: string;

    uid?: string;
}

export interface GraphDataEdge {
    type: string;
    name: string;
    direction: number;
    source: string;
    target: string;
    remark: string;
    value?: number;

    uid?: string;
    from?: string;
    to?: string
    id?: string;
    label?: string;
}

const getNodes = (list: GraphDataNode[]) => {
    const nodes: GraphDataNode[] = list?.map(d => {
        return {
            id: d.uid,
            type: d.type,
            name: d.name,
            label: d.name,
            avatar: d.avatar
        };
    })
    return nodes || [];
}

const getEdges = (list: GraphDataEdge[]) => {
    const edges: GraphDataEdge[] = list?.map(d => {
        return {
            uid: d.uid,
            type: d.type,
            name: d.name,
            direction: d.direction,
            source: d.from,
            target: d.to,
            remark: d.remark,
            label: d.name,
            value: d.value || 5,
        };
    })
    return edges || [];
}

export const graphData = (): GraphDataInfo => {
    const nodes: GraphDataNode[] = getNodes(data.nodes);
    const edges: GraphDataEdge[] = getEdges(data.edges);
    return {
        parent: data.parent,
        name: data.name,
        center: data.name,
        nodes: nodes || [],
        edges: edges || []
    };
}

export const getNode = (id: string): GraphDataNode | null => {
    for (const node of data.nodes) {
        if(node.id === id || node.uid === id) {
            return node;
        }
    }
    return null;
}

// http://szdown.suii.cn/c23deaf6-b09f-4e15-9d4a-0f8b39b2972c