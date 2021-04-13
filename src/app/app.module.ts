import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { G6GraphComponent } from './components/g6-graph/g6-graph.component';
import { G6GraphDemoComponent } from './components/g6-graph-demo/g6-graph-demo.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CreateNodeComponent } from './components/g6-graph/create-node/create-node.component';


registerLocaleData(zh);
const ngZorroComponents = [NzButtonModule, NzModalModule, NzCardModule]

@NgModule({
  declarations: [
    AppComponent,
    G6GraphComponent,
    G6GraphDemoComponent,
    CreateNodeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ...ngZorroComponents,
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent]
})
export class AppModule { }
