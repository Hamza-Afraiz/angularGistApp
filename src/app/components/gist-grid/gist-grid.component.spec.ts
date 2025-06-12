import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GistGridComponent } from './gist-grid.component';

describe('GistGridComponent', () => {
  let component: GistGridComponent;
  let fixture: ComponentFixture<GistGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GistGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GistGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
