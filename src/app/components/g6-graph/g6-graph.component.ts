import { Component, OnInit } from '@angular/core';
import G6GraphModel from 'src/app/mods/g6_utils/g6-graph';

import insertCss from 'insert-css';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { CreateNodeComponent } from './create-node/create-node.component';
import { ClickType } from 'src/app/mods/g6_utils/g6';
import { getNode, GraphDataNode } from 'src/app/mods/g6_utils/g6-data';
insertCss(`
  .g6-component-contextmenu {
    position: absolute;
    z-index: 2;
    list-style-type: none;
    background-color: #363b40;
    border-radius: 6px;
    font-size: 14px;
    color: hsla(0,0%,100%,.85);
    width: fit-content;
    transition: opacity .2s;
    text-align: center;
    padding: 0px 20px 0px 20px;
		box-shadow: 0 5px 18px 0 rgba(0, 0, 0, 0.6);
		border: 0px;
  }
  .g6-component-contextmenu ul {
		padding-left: 0px;
		margin: 0;
  }
  .g6-component-contextmenu li {
    cursor: pointer;
    list-style-type: none;
    list-style: none;
    margin-left: 0;
    line-height: 38px;
  }
  .g6-component-contextmenu li:hover {
    color: #aaaaaa;
	}
`);

@Component({
  selector: 'app-g6-graph',
  templateUrl: './g6-graph.component.html',
  styleUrls: ['./g6-graph.component.less']
})
export class G6GraphComponent implements OnInit {
  susWidth = -300;
  node: any | null;
  constructor(private modal: NzModalService) { }

  ngOnInit(): void {
    // G6ClassModel.install.newG6Graph();
    G6GraphModel.instance.callback = (item: any | null, type: ClickType) => {
      switch (type) {
        case ClickType.Node:
          this.onNodeClick(item)
          break;
        case ClickType.Canvas:
          this.onCanvasClick(item)
          break;
        case ClickType.Edge:

          break;
        default:
          break;
      }
    }
    G6GraphModel.instance.initGraph()
  }

  onNodeClick(e: any | null): void {
    // console.log('node click', e)
    const node = getNode(e._cfg.id)
    if(node) {
      this.node = node;
      this.susWidth = 0;
      console.log(node)
    }
  }

  onCanvasClick(e: any | null): void {
    console.log('canvas click', e)
    this.node = null;
    this.susWidth = -300;
  }

  createCustomButtonModal(): void {
    const modal: NzModalRef = this.modal.create({
      nzTitle: `${this.node?.name}`,
      nzContent: CreateNodeComponent,
      nzFooter: null
    });
  }
}
