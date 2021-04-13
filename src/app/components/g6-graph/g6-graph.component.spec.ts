import { ComponentFixture, TestBed } from '@angular/core/testing';

import { G6GraphComponent } from './g6-graph.component';

describe('G6GraphComponent', () => {
  let component: G6GraphComponent;
  let fixture: ComponentFixture<G6GraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ G6GraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(G6GraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
