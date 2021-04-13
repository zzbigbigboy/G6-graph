import { ComponentFixture, TestBed } from '@angular/core/testing';

import { G6GraphDemoComponent } from './g6-graph-demo.component';

describe('G6GraphDemoComponent', () => {
  let component: G6GraphDemoComponent;
  let fixture: ComponentFixture<G6GraphDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ G6GraphDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(G6GraphDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
