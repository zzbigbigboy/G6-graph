import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { G6GraphDemoComponent } from './components/g6-graph-demo/g6-graph-demo.component';
import { G6GraphComponent } from './components/g6-graph/g6-graph.component';

const routes: Routes = [
  {path: '', component: G6GraphComponent},
  {path: 'graph', component: G6GraphDemoComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
