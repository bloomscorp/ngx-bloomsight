import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxBloomsightComponent } from './ngx-bloomsight.component';
import { NgxBloomsightModule } from './ngx-bloomsight.module';

/**
 * Host that reaches the component through `NgxBloomsightModule` rather than
 * importing it directly. This is the path every existing consumer uses, so it
 * is the one that has to keep working now that the component is standalone and
 * the module only re-exports it.
 */
@Component({
  standalone: true,
  imports: [NgxBloomsightModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<lib-ngx-bloomsight></lib-ngx-bloomsight>'
})
class HostComponent { }

describe('NgxBloomsightComponent', () => {
  let component: NgxBloomsightComponent;
  let fixture: ComponentFixture<NgxBloomsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NgxBloomsightComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxBloomsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be standalone, so it can be imported without a module', () => {
    // `imports: [NgxBloomsightComponent]` above would throw for a declared
    // component, so reaching this point already proves it. Assert the flag too,
    // so an accidental revert to `standalone: false` fails loudly rather than
    // silently changing how consumers have to wire it up.
    const def = (NgxBloomsightComponent as any).ɵcmp;
    expect(def.standalone).toBe(true);
  });

  it('should render its template', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('ngx-bloomsight works!');
  });
});

describe('NgxBloomsightComponent via NgxBloomsightModule', () => {

  it('should still be reachable through the module, for existing consumers', async () => {
    await TestBed.configureTestingModule({
      imports: [ HostComponent ]
    }).compileComponents();

    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();

    const text = (host.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('ngx-bloomsight works!');
  });
});
