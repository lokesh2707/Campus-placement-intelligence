import {
  PrismaClient,
  Role,
  UserStatus,
  RecordStatus,
  AcademicVerificationStatus,
  SkillProficiency,
  WorkPreference,
} from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive development database seed for Phase 3...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Refusing to run dev seed script in production!');
  }

  const DEFAULT_DEV_PASSWORD = 'Password123!';
  const passwordHash = await argon2.hash(DEFAULT_DEV_PASSWORD, {
    type: argon2.argon2id,
  });

  // 1. College
  const college = await prisma.college.upsert({
    where: { code: 'AIT' },
    update: { name: 'Apex Institute of Technology' },
    create: {
      name: 'Apex Institute of Technology',
      code: 'AIT',
      website: 'https://ait.campus.edu',
      location: 'Bengaluru, Karnataka, India',
      status: RecordStatus.ACTIVE,
    },
  });
  console.log(`  ✓ College: ${college.name} (${college.code})`);

  // 2. Campuses
  const campusMain = await prisma.campus.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'MAIN' } },
    update: {},
    create: {
      name: 'Main Technology Campus',
      code: 'MAIN',
      location: 'Electronic City, Bengaluru',
      collegeId: college.id,
    },
  });

  const campusNorth = await prisma.campus.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'NORTH' } },
    update: {},
    create: {
      name: 'North Innovation Campus',
      code: 'NORTH',
      location: 'Hebbal, Bengaluru',
      collegeId: college.id,
    },
  });
  console.log(`  ✓ Campuses: ${campusMain.name}, ${campusNorth.name}`);

  // 3. Departments
  const deptCSE = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'CSE' } },
    update: {},
    create: {
      name: 'Computer Science and Engineering',
      code: 'CSE',
      collegeId: college.id,
      status: RecordStatus.ACTIVE,
    },
  });

  const deptECE = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'ECE' } },
    update: {},
    create: {
      name: 'Electronics and Communication Engineering',
      code: 'ECE',
      collegeId: college.id,
      status: RecordStatus.ACTIVE,
    },
  });

  const deptEEE = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'EEE' } },
    update: {},
    create: {
      name: 'Electrical and Electronics Engineering',
      code: 'EEE',
      collegeId: college.id,
      status: RecordStatus.ACTIVE,
    },
  });

  const deptMECH = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: 'MECH' } },
    update: {},
    create: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      collegeId: college.id,
      status: RecordStatus.ACTIVE,
    },
  });
  console.log(`  ✓ Departments: CSE, ECE, EEE, MECH`);

  // 4. Degrees
  const degreeCSE = await prisma.degree.upsert({
    where: { departmentId_code: { departmentId: deptCSE.id, code: 'BTECH-CSE' } },
    update: {},
    create: {
      name: 'Bachelor of Technology in Computer Science',
      code: 'BTECH-CSE',
      departmentId: deptCSE.id,
    },
  });

  const degreeECE = await prisma.degree.upsert({
    where: { departmentId_code: { departmentId: deptECE.id, code: 'BTECH-ECE' } },
    update: {},
    create: {
      name: 'Bachelor of Technology in Electronics & Communication',
      code: 'BTECH-ECE',
      departmentId: deptECE.id,
    },
  });

  const degreeMECH = await prisma.degree.upsert({
    where: { departmentId_code: { departmentId: deptMECH.id, code: 'BTECH-MECH' } },
    update: {},
    create: {
      name: 'Bachelor of Technology in Mechanical Engineering',
      code: 'BTECH-MECH',
      departmentId: deptMECH.id,
    },
  });
  console.log(`  ✓ Degrees: B.Tech CSE, B.Tech ECE, B.Tech MECH`);

  // 5. Batches
  const batchCSE2025 = await prisma.batch.upsert({
    where: { degreeId_name: { degreeId: degreeCSE.id, name: 'Batch 2025' } },
    update: {},
    create: {
      name: 'Batch 2025',
      startYear: 2021,
      endYear: 2025,
      degreeId: degreeCSE.id,
    },
  });

  const batchCSE2026 = await prisma.batch.upsert({
    where: { degreeId_name: { degreeId: degreeCSE.id, name: 'Batch 2026' } },
    update: {},
    create: {
      name: 'Batch 2026',
      startYear: 2022,
      endYear: 2026,
      degreeId: degreeCSE.id,
    },
  });

  const batchECE2026 = await prisma.batch.upsert({
    where: { degreeId_name: { degreeId: degreeECE.id, name: 'Batch 2026' } },
    update: {},
    create: {
      name: 'Batch 2026',
      startYear: 2022,
      endYear: 2026,
      degreeId: degreeECE.id,
    },
  });

  const batchMECH2026 = await prisma.batch.upsert({
    where: { degreeId_name: { degreeId: degreeMECH.id, name: 'Batch 2026' } },
    update: {},
    create: {
      name: 'Batch 2026',
      startYear: 2022,
      endYear: 2026,
      degreeId: degreeMECH.id,
    },
  });
  console.log(`  ✓ Batches created for 2025 and 2026`);

  // 6. Base Users & Department Coordinators
  const baseUsers = [
    {
      email: 'superadmin@campus.edu',
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
      phone: '+919000000001',
      collegeId: college.id,
    },
    {
      email: 'placementadmin@campus.edu',
      firstName: 'Placement',
      lastName: 'Director',
      role: Role.PLACEMENT_ADMIN,
      phone: '+919000000002',
      collegeId: college.id,
    },
    {
      email: 'placementcoord@campus.edu',
      firstName: 'Placement',
      lastName: 'Coordinator',
      role: Role.PLACEMENT_COORDINATOR,
      phone: '+919000000003',
      collegeId: college.id,
    },
    {
      email: 'deptcoord@campus.edu',
      firstName: 'CSE Department',
      lastName: 'Coordinator',
      role: Role.DEPARTMENT_COORDINATOR,
      phone: '+919000000004',
      collegeId: college.id,
      departmentId: deptCSE.id,
    },
    {
      email: 'deptcoord-ece@campus.edu',
      firstName: 'ECE Department',
      lastName: 'Coordinator',
      role: Role.DEPARTMENT_COORDINATOR,
      phone: '+919000000014',
      collegeId: college.id,
      departmentId: deptECE.id,
    },
    {
      email: 'recruiter@techcorp.com',
      firstName: 'Corporate',
      lastName: 'Recruiter',
      role: Role.RECRUITER,
      phone: '+919000000005',
    },
  ];

  for (const u of baseUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        collegeId: u.collegeId || null,
        departmentId: u.departmentId || null,
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phone: u.phone,
        collegeId: u.collegeId || null,
        departmentId: u.departmentId || null,
      },
    });
  }

  // 7. Skills Taxonomy (25+ skills)
  const skillsData = [
    { name: 'JavaScript', category: 'Programming Language', description: 'Core web programming language' },
    { name: 'TypeScript', category: 'Programming Language', description: 'Typed superset of JavaScript' },
    { name: 'Python', category: 'Programming Language', description: 'General-purpose programming and ML' },
    { name: 'Java', category: 'Programming Language', description: 'Enterprise and Android development' },
    { name: 'C++', category: 'Programming Language', description: 'System software and high performance' },
    { name: 'Go', category: 'Programming Language', description: 'Cloud and distributed systems' },
    { name: 'React', category: 'Framework', description: 'UI component library' },
    { name: 'Next.js', category: 'Framework', description: 'Full-stack React framework' },
    { name: 'Node.js', category: 'Framework', description: 'JavaScript runtime environment' },
    { name: 'Express', category: 'Framework', description: 'Web application framework for Node' },
    { name: 'FastAPI', category: 'Framework', description: 'High-performance Python web framework' },
    { name: 'PostgreSQL', category: 'Database', description: 'Relational database management' },
    { name: 'MongoDB', category: 'Database', description: 'Document-oriented NoSQL database' },
    { name: 'Redis', category: 'Database', description: 'In-memory key-value cache and store' },
    { name: 'Docker', category: 'DevOps', description: 'Containerization platform' },
    { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration' },
    { name: 'AWS', category: 'Cloud', description: 'Amazon Web Services cloud platform' },
    { name: 'Git', category: 'Tools', description: 'Distributed version control system' },
    { name: 'Linux', category: 'Tools', description: 'Unix-like operating system' },
    { name: 'PyTorch', category: 'AI/ML', description: 'Deep learning neural network framework' },
    { name: 'TensorFlow', category: 'AI/ML', description: 'Machine learning platform' },
    { name: 'Scikit-Learn', category: 'AI/ML', description: 'Machine learning in Python' },
    { name: 'Jest', category: 'Testing', description: 'JavaScript testing framework' },
    { name: 'Problem Solving', category: 'Soft Skill', description: 'Analytical reasoning and algorithmic thinking' },
    { name: 'Communication', category: 'Soft Skill', description: 'Verbal and written technical communication' },
    { name: 'Teamwork', category: 'Soft Skill', description: 'Cross-functional collaborative engineering' },
  ];

  const seededSkills: any[] = [];
  for (const s of skillsData) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: { name: s.name, category: s.category, description: s.description },
    });
    seededSkills.push(skill);
  }
  console.log(`  ✓ Seeded ${seededSkills.length} skills in taxonomy`);

  // 8. 20+ Students across CSE, ECE, EEE, MECH
  const rawStudents = [
    // CSE Students
    { email: 'student@campus.edu', firstName: 'Aarav', lastName: 'Sharma', reg: 'REG2022001', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 8.95, ten: 92.5, twelve: 91.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'ananya.iyer@campus.edu', firstName: 'Ananya', lastName: 'Iyer', reg: 'REG2022002', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 9.32, ten: 95.0, twelve: 94.2, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'rohan.verma@campus.edu', firstName: 'Rohan', lastName: 'Verma', reg: 'REG2022003', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 7.85, ten: 88.0, twelve: 85.5, backlogs: 0, status: AcademicVerificationStatus.PENDING },
    { email: 'priya.nair@campus.edu', firstName: 'Priya', lastName: 'Nair', reg: 'REG2022004', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 8.42, ten: 91.0, twelve: 89.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'vikram.singh@campus.edu', firstName: 'Vikram', lastName: 'Singh', reg: 'REG2022005', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 6.95, ten: 80.0, twelve: 78.5, backlogs: 1, status: AcademicVerificationStatus.PENDING },
    { email: 'sneha.patel@campus.edu', firstName: 'Sneha', lastName: 'Patel', reg: 'REG2021006', dept: deptCSE, degree: degreeCSE, batch: batchCSE2025, cgpa: 9.10, ten: 94.0, twelve: 92.5, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'karthik.rajan@campus.edu', firstName: 'Karthik', lastName: 'Rajan', reg: 'REG2021007', dept: deptCSE, degree: degreeCSE, batch: batchCSE2025, cgpa: 7.50, ten: 82.5, twelve: 81.0, backlogs: 0, status: AcademicVerificationStatus.PENDING },

    // ECE Students
    { email: 'diya.menon@campus.edu', firstName: 'Diya', lastName: 'Menon', reg: 'REG2022008', dept: deptECE, degree: degreeECE, batch: batchECE2026, cgpa: 8.75, ten: 90.0, twelve: 88.5, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'arjun.reddy@campus.edu', firstName: 'Arjun', lastName: 'Reddy', reg: 'REG2022009', dept: deptECE, degree: degreeECE, batch: batchECE2026, cgpa: 7.90, ten: 84.0, twelve: 82.0, backlogs: 0, status: AcademicVerificationStatus.PENDING },
    { email: 'meera.joshi@campus.edu', firstName: 'Meera', lastName: 'Joshi', reg: 'REG2022010', dept: deptECE, degree: degreeECE, batch: batchECE2026, cgpa: 9.20, ten: 93.5, twelve: 91.8, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'rahul.kulkarni@campus.edu', firstName: 'Rahul', lastName: 'Kulkarni', reg: 'REG2022011', dept: deptECE, degree: degreeECE, batch: batchECE2026, cgpa: 6.80, ten: 78.0, twelve: 75.0, backlogs: 2, status: AcademicVerificationStatus.REJECTED },
    { email: 'pooja.hegde@campus.edu', firstName: 'Pooja', lastName: 'Hegde', reg: 'REG2022012', dept: deptECE, degree: degreeECE, batch: batchECE2026, cgpa: 8.15, ten: 86.5, twelve: 84.0, backlogs: 0, status: AcademicVerificationStatus.PENDING },

    // EEE Students (using degreeECE / batchECE as placeholder structure)
    { email: 'siddharth.deshmukh@campus.edu', firstName: 'Siddharth', lastName: 'Deshmukh', reg: 'REG2022013', dept: deptEEE, degree: degreeECE, batch: batchECE2026, cgpa: 8.35, ten: 89.0, twelve: 87.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'tanvi.shah@campus.edu', firstName: 'Tanvi', lastName: 'Shah', reg: 'REG2022014', dept: deptEEE, degree: degreeECE, batch: batchECE2026, cgpa: 7.60, ten: 81.0, twelve: 79.5, backlogs: 0, status: AcademicVerificationStatus.PENDING },
    { email: 'aditya.chatterjee@campus.edu', firstName: 'Aditya', lastName: 'Chatterjee', reg: 'REG2022015', dept: deptEEE, degree: degreeECE, batch: batchECE2026, cgpa: 8.80, ten: 92.0, twelve: 90.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'divya.rao@campus.edu', firstName: 'Divya', lastName: 'Rao', reg: 'REG2022016', dept: deptEEE, degree: degreeECE, batch: batchECE2026, cgpa: 7.25, ten: 79.0, twelve: 76.5, backlogs: 1, status: AcademicVerificationStatus.PENDING },

    // MECH Students
    { email: 'manish.pandey@campus.edu', firstName: 'Manish', lastName: 'Pandey', reg: 'REG2022017', dept: deptMECH, degree: degreeMECH, batch: batchMECH2026, cgpa: 8.50, ten: 87.0, twelve: 86.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'shreya.sen@campus.edu', firstName: 'Shreya', lastName: 'Sen', reg: 'REG2022018', dept: deptMECH, degree: degreeMECH, batch: batchMECH2026, cgpa: 7.95, ten: 83.5, twelve: 81.5, backlogs: 0, status: AcademicVerificationStatus.PENDING },
    { email: 'varun.dhawan@campus.edu', firstName: 'Varun', lastName: 'Kumar', reg: 'REG2022019', dept: deptMECH, degree: degreeMECH, batch: batchMECH2026, cgpa: 6.90, ten: 76.0, twelve: 74.0, backlogs: 0, status: AcademicVerificationStatus.PENDING },
    { email: 'neha.gupta@campus.edu', firstName: 'Neha', lastName: 'Gupta', reg: 'REG2022020', dept: deptMECH, degree: degreeMECH, batch: batchMECH2026, cgpa: 8.65, ten: 90.5, twelve: 88.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
    { email: 'aman.shukla@campus.edu', firstName: 'Aman', lastName: 'Shukla', reg: 'REG2022021', dept: deptCSE, degree: degreeCSE, batch: batchCSE2026, cgpa: 8.20, ten: 85.0, twelve: 83.0, backlogs: 0, status: AcademicVerificationStatus.VERIFIED },
  ];

  for (let i = 0; i < rawStudents.length; i++) {
    const st = rawStudents[i];
    const user = await prisma.user.upsert({
      where: { email: st.email },
      update: {
        firstName: st.firstName,
        lastName: st.lastName,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        collegeId: college.id,
        departmentId: st.dept.id,
      },
      create: {
        email: st.email,
        passwordHash,
        firstName: st.firstName,
        lastName: st.lastName,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phone: `+9198000000${(i + 10).toString().padStart(2, '0')}`,
        collegeId: college.id,
        departmentId: st.dept.id,
      },
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentId: st.reg,
        cgpa: st.cgpa,
        tenthPercentage: st.ten,
        twelfthPercentage: st.twelve,
        backlogs: st.backlogs,
        activeBacklogs: st.backlogs,
        verificationStatus: st.status,
      },
      create: {
        userId: user.id,
        studentId: st.reg,
        collegeId: college.id,
        departmentId: st.dept.id,
        degreeId: st.degree.id,
        batchId: st.batch.id,
        graduationYear: st.batch.endYear,
        phone: user.phone,
        cgpa: st.cgpa,
        tenthPercentage: st.ten,
        twelfthPercentage: st.twelve,
        backlogs: st.backlogs,
        activeBacklogs: st.backlogs,
        bio: `Enthusiastic ${st.dept.name} student passionate about solving real-world engineering challenges.`,
        verificationStatus: st.status,
      },
    });

    // Assign 3-4 skills per student
    const assignedSkillIndices = [i % seededSkills.length, (i + 1) % seededSkills.length, (i + 2) % seededSkills.length, (i + 3) % seededSkills.length];
    for (const skillIdx of assignedSkillIndices) {
      const sk = seededSkills[skillIdx];
      await prisma.studentSkill.upsert({
        where: {
          studentProfileId_skillId: {
            studentProfileId: studentProfile.id,
            skillId: sk.id,
          },
        },
        update: {},
        create: {
          studentProfileId: studentProfile.id,
          skillId: sk.id,
          proficiency: i % 2 === 0 ? SkillProficiency.ADVANCED : SkillProficiency.INTERMEDIATE,
          yearsOfExperience: 1.5,
        },
      });
    }

    // Assign Project
    await prisma.studentProject.create({
      data: {
        studentProfileId: studentProfile.id,
        title: `Campus AI Portfolio Project #${i + 1}`,
        description: 'End-to-end full-stack web and machine learning application with distributed microservices architecture.',
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        projectUrl: 'https://project-demo.campus.edu',
        githubUrl: `https://github.com/student${i + 1}/project-demo`,
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-12-15'),
        isCurrent: false,
      },
    });

    // Assign Career Preferences
    await prisma.studentCareerPreference.upsert({
      where: { studentProfileId: studentProfile.id },
      update: {},
      create: {
        studentProfileId: studentProfile.id,
        preferredRoles: ['Software Engineer', 'Full Stack Developer', 'Data Engineer'],
        preferredLocations: ['Bengaluru', 'Hyderabad', 'Pune'],
        remotePreference: true,
        minimumSalary: 800000,
        preferredSalary: 1400000,
        currency: 'INR',
        workPreference: WorkPreference.HYBRID,
      },
    });

    // Assign Active Resume
    await prisma.resume.create({
      data: {
        studentProfileId: studentProfile.id,
        fileKey: `resumes/${st.reg}_resume_v1.pdf`,
        originalFilename: `${st.firstName}_${st.lastName}_Resume.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: BigInt(245000),
        version: 1,
        isActive: true,
      },
    });
  }

  console.log(`  ✓ Seeded ${rawStudents.length} comprehensive student profiles with skills, projects, preferences, and resumes.`);
  console.log('✅ Development database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
