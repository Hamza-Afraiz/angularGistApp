import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicGistsComponent } from './public-gists.component';

describe('PublicGistsComponent', () => {
  let component: PublicGistsComponent;
  let fixture: ComponentFixture<PublicGistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicGistsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicGistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
