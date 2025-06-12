import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GistDetailComponent } from './gist-detail.component';

describe('GistDetailComponent', () => {
  let component: GistDetailComponent;
  let fixture: ComponentFixture<GistDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GistDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GistDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
