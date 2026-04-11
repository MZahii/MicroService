import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStaff } from './create-staff';

describe('CreateStaff', () => {
  let component: CreateStaff;
  let fixture: ComponentFixture<CreateStaff>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStaff]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateStaff);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
