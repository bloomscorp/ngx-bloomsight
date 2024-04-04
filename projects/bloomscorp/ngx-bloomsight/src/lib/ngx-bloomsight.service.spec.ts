import { TestBed } from '@angular/core/testing';

import { NgxBloomsightService } from './ngx-bloomsight.service';

describe('NgxBloomsightService', () => {
  let service: NgxBloomsightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxBloomsightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
