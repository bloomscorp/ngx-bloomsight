import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

/**
 * Standalone since the Angular 19 step.
 *
 * Angular 19 made `standalone: true` the default, and the automated migration
 * pinned this component to `standalone: false` to preserve the old behaviour.
 * We went the other way on purpose: aligning with the framework default now
 * means later majors have nothing to migrate here, and the flag can simply be
 * dropped once the peer floor passes 19.
 *
 * It is still CLI scaffolding and renders nothing useful — P2 in
 * MODERNISATION.md deletes it at 2.0.0. It stays until then because it is part
 * of the published API surface.
 */
@Component({
  selector: 'lib-ngx-bloomsight',
  standalone: true,
  template: `
    <p>
      ngx-bloomsight works!
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class NgxBloomsightComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
