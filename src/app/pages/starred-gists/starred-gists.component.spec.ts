import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarredGistsComponent } from './starred-gists.component';

describe('StarredGistsComponent', () => {
  let component: StarredGistsComponent;
  let fixture: ComponentFixture<StarredGistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarredGistsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StarredGistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
