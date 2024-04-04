import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxBloomsightComponent } from './ngx-bloomsight.component';

describe('NgxBloomsightComponent', () => {
  let component: NgxBloomsightComponent;
  let fixture: ComponentFixture<NgxBloomsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxBloomsightComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxBloomsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
