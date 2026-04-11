import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHr } from './create-hr';

describe('CreateHr', () => {
  let component: CreateHr;
  let fixture: ComponentFixture<CreateHr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHr]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateHr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
