import { ModuleWithProviders } from '@angular/core';

// Deliberately imported from the package's own public surface — the same way a
// consuming application would, and with no reference to
// `@bloomscorp/bloomsight.js`. If this file ever needs a core import to
// compile, the public API is incomplete again (P1).
import { BloomsightConfig, NgxBloomsightModule } from '../public-api';

describe('NgxBloomsightModule.forRoot', () => {

  // Typed with the exported alias, not the core's `IConfig`. This assignment is
  // the actual regression test for P1: it only compiles while the config type
  // is reachable from the public API.
  const config: BloomsightConfig = {
    propertyToken: '65d72f0b5e990c6028790156'
  } as BloomsightConfig;

  it('should accept a config typed purely from the public API', () => {
    const configured: ModuleWithProviders<NgxBloomsightModule> =
      NgxBloomsightModule.forRoot(config);

    expect(configured.ngModule).toBe(NgxBloomsightModule);
  });

  it('should provide the config under the token the services inject', () => {
    const providers = NgxBloomsightModule.forRoot(config).providers ?? [];

    const configProvider = providers.find(
      (p: any) => p && p.provide === 'bloomsightConfig'
    ) as { provide: string; useValue: BloomsightConfig } | undefined;

    expect(configProvider).toBeDefined();
    expect(configProvider!.useValue).toBe(config);
  });

  it('should provide both services, so forRoot is what makes them injectable', () => {
    // Documents B6: the services are provided by forRoot() and *only* by
    // forRoot(), which is why importing the module plainly leaves them
    // unresolvable. Asserted rather than described so the 2.0.0 rewrite has to
    // deal with it deliberately.
    const providers = NgxBloomsightModule.forRoot(config).providers ?? [];
    const names = providers
      .map((p: any) => (typeof p === 'function' ? p.name : undefined))
      .filter(Boolean);

    expect(names).toContain('BloomsightEventService');
    expect(names).toContain('BloomsightMailService');
  });
});
