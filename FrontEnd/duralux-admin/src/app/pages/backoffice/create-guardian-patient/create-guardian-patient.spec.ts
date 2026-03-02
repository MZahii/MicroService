import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGuardianPatient } from './create-guardian-patient';

describe('CreateGuardianPatient', () => {
  let component: CreateGuardianPatient;
  let fixture: ComponentFixture<CreateGuardianPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGuardianPatient]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateGuardianPatient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
