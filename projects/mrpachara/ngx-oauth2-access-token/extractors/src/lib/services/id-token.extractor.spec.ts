import { TestBed } from '@angular/core/testing';
import {
  ACCESS_TOKEN_ID,
  createIdKey,
} from '@mrpachara/ngx-oauth2-access-token';
import { ID_TOKEN_STORAGE, ID_TOKEN_VERIFICATION } from '../tokens';
import { IdTokenExtractor } from './id-token.extractor';

const id = createIdKey('test-id-token-extractor-id');

const mockStorage = {
  load: vi.fn(),
  store: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

const mockVerification = vi.fn();

describe('IdTokenExtractor', () => {
  let service: IdTokenExtractor;

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ACCESS_TOKEN_ID, useValue: id },
        { provide: ID_TOKEN_STORAGE, useValue: mockStorage },
        { provide: ID_TOKEN_VERIFICATION, useFactory: () => mockVerification },
        IdTokenExtractor,
      ],
    });

    service = TestBed.inject(IdTokenExtractor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it.todo('others unit tests');
});
