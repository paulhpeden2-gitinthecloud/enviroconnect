import { mutation } from "./_generated/server";

const VENDORS = [
  {
    name: "Blue Environmental",
    email: "info@blueenv.com",
    company: "Blue Environmental",
    description: "Established to provide knowledgeable permit guidance and compliance support for businesses throughout Washington State. Specializes in helping industrial, construction, and agricultural businesses comply with water quality, stormwater, wastewater, and air quality permits. Services include sampling, testing, inspections, SWPPP preparation, corrective actions, document preparation, and training.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Air Quality / Emissions",
      "Pollution Prevention Planning",
      "Environmental Training",
    ],
    certifications: ["Certified Professional in Stormwater Quality (CPSWQ)"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Olympia / Thurston County", "Southwest Washington"],
    phone: "",
    website: "https://www.blueenv.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Northern Environmental",
    email: "info@northernenv.com",
    company: "Northern Environmental LLC",
    description: "Washington State's foremost locally owned and operated full-service environmental and waste management company, formed in 2007. Management team has 30+ years experience locally in Washington State with collective experience of over 150 years serving Washington's variety of industries.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Dangerous Waste Compliance",
      "Wastewater Management",
      "Emergency Response / HAZMAT",
    ],
    certifications: ["40-Hour HAZWOPER"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Olympia / Thurston County", "Eastern Washington", "Central Washington", "Northwest Washington / Bellingham"],
    phone: "",
    website: "https://www.northernenv.com",
    city: "Tacoma",
    state: "WA",
  },
  {
    name: "Aqualis Stormwater Management",
    email: "info@aqualisco.com",
    company: "Aqualis Stormwater Management",
    description: "International leader in stormwater and wastewater management services. Provides innovative maintenance, rehabilitation, and consulting for stormwater and wastewater systems, water quality testing, and green infrastructure design. Founded in 2001, operates across the US and Puerto Rico.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Pollution Prevention Planning",
    ],
    certifications: [],
    serviceArea: ["Seattle Metro", "Portland Metro", "Southwest Washington"],
    phone: "",
    website: "https://aqualisco.com",
    city: "Edmonds",
    state: "WA",
  },
  {
    name: "Nisqually Environmental",
    email: "info@nisquallyenvironmental.com",
    company: "Nisqually Environmental",
    description: "Ecological services company based in the Nisqually watershed area of Washington State, providing environmental services to the South Sound region.",
    services: [
      "Environmental Site Assessments",
      "Pollution Prevention Planning",
    ],
    certifications: [],
    serviceArea: ["Olympia / Thurston County", "Tacoma / South Sound"],
    phone: "(360) 400-3566",
    website: "https://nisquallyenvironmental.com",
    city: "Yelm",
    state: "WA",
  },
  {
    name: "Herrera Environmental Consultants",
    email: "info@herrerainc.com",
    company: "Herrera Environmental Consultants, Inc.",
    description: "Employee-owned consulting firm founded in 1980, integrating science, engineering, and design to deliver sustainable, nature-based infrastructure. Over 100 staff across five offices. Interdisciplinary team of scientists, engineers, and regulatory specialists serving municipalities, government agencies, businesses, tribes, and non-profits.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Environmental Site Assessments",
      "Pollution Prevention Planning",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Northwest Washington / Bellingham"],
    phone: "",
    website: "https://www.herrerainc.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Hawk Environmental Services",
    email: "info@hawkenvironmental.com",
    company: "Hawk Environmental Services, Inc.",
    description: "Neutral, third-party testing and inspection firm offering practical solutions for healthy indoor environments and safe renovations. Founded in 2013 in Seattle, with offices in Seattle and Portland. Specializes in indoor air quality, asbestos, lead, mold, and VOC testing.",
    services: [
      "Asbestos / Lead Abatement",
      "Air Quality / Emissions",
      "Environmental Site Assessments",
    ],
    certifications: ["AHERA Certified Inspector"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro"],
    phone: "",
    website: "https://hawkenvironmental.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "EHS International",
    email: "info@ehsintl.com",
    company: "EHS International, Inc.",
    description: "Founded in 1996, recognized leader in environmental assessments, remediation design, hazardous materials identification and abatement, indoor air quality, occupational health and safety, and construction management services. Provides Phase I/II/III ESAs, UST assessment, and hazardous materials management. Now a subsidiary of SoundEarth Strategies.",
    services: [
      "Environmental Site Assessments",
      "Asbestos / Lead Abatement",
      "Underground Storage Tanks",
      "Dangerous Waste Compliance",
      "Air Quality / Emissions",
    ],
    certifications: ["40-Hour HAZWOPER", "Certified Hazardous Materials Manager (CHMM)", "Certified Industrial Hygienist (CIH)"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Eastern Washington"],
    phone: "",
    website: "https://www.ehsintl.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "AECOM",
    email: "info@aecom.com",
    company: "AECOM",
    description: "Global infrastructure consulting firm with over 300 environmental staff in the Northwest. Portland Environment group covers Remediation, Impact Assessment & Permitting, and Sustainability. Services include environmental investigations, cleanup programs, environmental impact assessment, wetland delineation, permitting, cultural resources, sustainable design, EHS, and air quality.",
    services: [
      "Environmental Site Assessments",
      "Dangerous Waste Compliance",
      "Air Quality / Emissions",
      "Pollution Prevention Planning",
      "Wastewater Management",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Portland Metro", "Seattle Metro", "Eastern Oregon", "Eastern Washington"],
    phone: "",
    website: "https://aecom.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "Tetra Tech",
    email: "info@tetratech.com",
    company: "Tetra Tech, Inc.",
    description: "Global leader in water, environment, and sustainable infrastructure with 25,000+ employees. Provides high-end consulting and engineering services. Full range of turnkey services from planning, permitting, and design to construction oversight and monitoring. Leading with Science approach.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Environmental Site Assessments",
      "Pollution Prevention Planning",
      "Air Quality / Emissions",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Seattle Metro", "Portland Metro", "Tacoma / South Sound"],
    phone: "",
    website: "https://www.tetratech.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Jacobs",
    email: "info@jacobs.com",
    company: "Jacobs Engineering Group, Inc.",
    description: "Global professional services firm with $15B revenue and 60,000 employees. Provides consulting, technical, scientific, and project delivery for government and private sector. Environmental science and planning business unit spans offices across Washington, Oregon, and Alaska.",
    services: [
      "Environmental Site Assessments",
      "Wastewater Management",
      "Stormwater Management (ISGP/CSGP)",
      "Air Quality / Emissions",
      "Pollution Prevention Planning",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Seattle Metro", "Portland Metro", "Tacoma / South Sound", "Eastern Washington"],
    phone: "",
    website: "https://www.jacobs.com",
    city: "Bellevue",
    state: "WA",
  },
  {
    name: "Alpine EHS",
    email: "info@alpineehs.com",
    company: "Alpine EHS",
    description: "Certified 100% Women's Business Enterprise (WBE) founded on the idea that better ways existed to approach EHS compliance. Goal is to take companies to the next level in environmental, health, and safety compliance and performance. Based in Seattle.",
    services: [
      "Air Quality / Emissions",
      "Dangerous Waste Compliance",
      "Spill Prevention (SPCC)",
      "Environmental Training",
      "Pollution Prevention Planning",
    ],
    certifications: ["Certified Hazardous Materials Manager (CHMM)", "40-Hour HAZWOPER"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound"],
    phone: "",
    website: "https://www.alpineehs.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Antea Group",
    email: "info@anteagroup.com",
    company: "Antea Group USA",
    description: "Global environment, health, safety and sustainability consulting firm. Services span environmental remediation, regulatory compliance, worker safety, M&A support, and sustainability strategy. Portland office serves oil & gas, wood products, and high tech markets. Access to 3,200+ employees in 75+ offices worldwide.",
    services: [
      "Environmental Site Assessments",
      "Dangerous Waste Compliance",
      "Air Quality / Emissions",
      "Pollution Prevention Planning",
      "Environmental Training",
    ],
    certifications: ["Licensed Environmental Professional", "Certified Hazardous Materials Manager (CHMM)"],
    serviceArea: ["Portland Metro", "Seattle Metro"],
    phone: "(800) 477-7411",
    website: "https://us.anteagroup.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "SWCA Environmental Consultants",
    email: "info@swca.com",
    company: "SWCA Environmental Consultants",
    description: "Helping clients tackle environmental challenges with Sound Science and Creative Solutions since 1981. Portland office (est. 2004) supports generation and land development markets. Team of cultural and natural experts specializing in environmental permitting, wetlands, geospatial data, and compliance. 45 years of experience.",
    services: [
      "Environmental Site Assessments",
      "Air Quality / Emissions",
      "Pollution Prevention Planning",
      "Stormwater Management (ISGP/CSGP)",
    ],
    certifications: ["Licensed Environmental Professional"],
    serviceArea: ["Portland Metro", "Oregon Coast", "Eastern Oregon"],
    phone: "",
    website: "https://www.swca.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "Anchor QEA",
    email: "info@anchorqea.com",
    company: "Anchor QEA, LLC",
    description: "Nationally recognized environmental science and engineering consulting firm specializing in aquatic, shoreline, and water resource projects, including coastal and flood resiliency. 500+ employees in 26 offices. Founded 1997, merged with QEA in 2009. Headquartered in Seattle.",
    services: [
      "Environmental Site Assessments",
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Pollution Prevention Planning",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Central Washington", "Eastern Washington"],
    phone: "",
    website: "https://www.anchorqea.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Citadel EHS",
    email: "info@citadelehs.com",
    company: "Citadel EHS",
    description: "Market-leading EHS&S consulting firm since 1993. Provides technically sound, cost-effective solutions to complex environmental, health, safety, and sustainability challenges. Opened Seattle office in 2024, Portland office in 2025. Services span engineering, environmental sciences, building sciences, compliance, industrial hygiene, and ESG.",
    services: [
      "Asbestos / Lead Abatement",
      "Environmental Site Assessments",
      "Air Quality / Emissions",
      "Dangerous Waste Compliance",
      "Environmental Training",
    ],
    certifications: ["Certified Industrial Hygienist (CIH)", "AHERA Certified Inspector", "40-Hour HAZWOPER"],
    serviceArea: ["Seattle Metro", "Portland Metro"],
    phone: "(818) 246-2707",
    website: "https://citadelehs.com",
    city: "Seattle",
    state: "WA",
  },
  {
    name: "Terracon",
    email: "info@terracon.com",
    company: "Terracon Consultants, Inc.",
    description: "Employee-owned consulting engineering firm serving the Pacific Northwest since 1998. Provides environmental, geotechnical, facilities, and materials services. 6,000+ employees in 175+ locations nationwide. Founded 1965.",
    services: [
      "Environmental Site Assessments",
      "Asbestos / Lead Abatement",
      "Stormwater Management (ISGP/CSGP)",
      "Underground Storage Tanks",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Portland Metro", "Seattle Metro"],
    phone: "(503) 659-3281",
    website: "https://www.terracon.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "Summit HSIH",
    email: "info@summithsih.com",
    company: "Summit Health, Safety, and Industrial Hygiene Services",
    description: "Leading provider of industrial hygiene, OSHA compliance, and workplace safety consulting with certified experts (CIH, CSP). Decades of experience across construction, manufacturing, oil & gas, and utilities. 113+ years of combined staff experience. Offices in Portland, Seattle, Spokane, and Tri-Cities.",
    services: [
      "Air Quality / Emissions",
      "Environmental Training",
      "Dangerous Waste Compliance",
    ],
    certifications: ["Certified Industrial Hygienist (CIH)", "40-Hour HAZWOPER"],
    serviceArea: ["Portland Metro", "Seattle Metro", "Eastern Washington"],
    phone: "",
    website: "https://summithsih.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "Clean Harbors",
    email: "info@cleanharbors.com",
    company: "Clean Harbors Environmental Services, Inc.",
    description: "Leading national supplier of environmental, energy, and industrial services with 160+ locations. Specializes in hazardous waste management, waste disposal & recycling, emergency response, chemical packing, field services, and industrial services. Expanded PNW presence via Emerald Services acquisition. Serves Washington, Eastern Oregon, North Idaho.",
    services: [
      "Dangerous Waste Compliance",
      "Emergency Response / HAZMAT",
      "Wastewater Management",
      "Pollution Prevention Planning",
    ],
    certifications: ["40-Hour HAZWOPER", "Certified Hazardous Materials Manager (CHMM)"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Eastern Washington", "Eastern Oregon"],
    phone: "",
    website: "https://www.cleanharbors.com",
    city: "Kent",
    state: "WA",
  },
  {
    name: "EQM",
    email: "info@eqm.com",
    company: "Environmental Quality Management, Inc.",
    description: "Founded in 1990, leading environmental consulting, stack testing, remediation, and construction company. Provides expertise in engineering and environmental compliance to industrial, public, and government sectors. Part of Arctic Slope Regional Corporation (ASRC) family. Offices in Portland and Seattle.",
    services: [
      "Air Quality / Emissions",
      "Dangerous Waste Compliance",
      "Wastewater Management",
      "Environmental Site Assessments",
      "Emergency Response / HAZMAT",
    ],
    certifications: ["Professional Engineer (PE)", "Certified Hazardous Materials Manager (CHMM)"],
    serviceArea: ["Portland Metro", "Seattle Metro"],
    phone: "",
    website: "https://eqm.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "GeoEngineers",
    email: "info@geoengineers.com",
    company: "GeoEngineers, Inc.",
    description: "Employee-owned engineering and earth science consulting firm founded in Washington State in 1980. 450+ diverse experts across offices in Redmond, Seattle, Tacoma, Bellingham, Portland, and Boise. Serves municipalities, industry, tribes, and non-profits with geotechnical engineering, remediation, groundwater, and permitting services.",
    services: [
      "Environmental Site Assessments",
      "Stormwater Management (ISGP/CSGP)",
      "Underground Storage Tanks",
      "Pollution Prevention Planning",
    ],
    certifications: ["Professional Engineer (PE)", "Licensed Environmental Professional"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Northwest Washington / Bellingham", "Eastern Washington"],
    phone: "",
    website: "https://www.geoengineers.com",
    city: "Redmond",
    state: "WA",
  },
  {
    name: "Barghausen Consulting Engineers",
    email: "info@barghausen.com",
    company: "Barghausen Consulting Engineers, Inc.",
    description: "Established in 1982, leading multi-disciplinary service firm offering civil engineering, land surveying, land use planning, and environmental services. Now part of Core States Group. In-house teams of planners, civil engineers, land surveyors, architects, and landscape architects specializing in commercial, industrial, and residential development.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Environmental Site Assessments",
      "Pollution Prevention Planning",
    ],
    certifications: ["Professional Engineer (PE)"],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound"],
    phone: "(425) 251-6222",
    website: "https://www.barghausen.com",
    city: "Kent",
    state: "WA",
  },
  {
    name: "Veolia",
    email: "info@veolia.com",
    company: "Veolia North America",
    description: "Global leader in environmental services addressing water, waste, and energy challenges. Network of 400+ company-owned or certified service centers nationwide including treatment, recovery, disposal facilities, sales offices, and transportation locations. Operations in Vancouver, WA area.",
    services: [
      "Dangerous Waste Compliance",
      "Wastewater Management",
      "Pollution Prevention Planning",
      "Emergency Response / HAZMAT",
    ],
    certifications: ["40-Hour HAZWOPER"],
    serviceArea: ["Portland Metro", "Southwest Washington", "Seattle Metro"],
    phone: "",
    website: "https://www.veolianorthamerica.com",
    city: "Vancouver",
    state: "WA",
  },
  {
    name: "WaterTectonics",
    email: "info@watertectonics.com",
    company: "WaterTectonics",
    description: "International leader in on-site water treatment technology and services since 1999. Engineers and manufactures custom water treatment solutions for storm, ground, industrial, marine, and contaminated water applications. WaveIonics technology has Washington DOE General Use Level Designation. Based in Everett, WA.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
    ],
    certifications: [],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Northwest Washington / Bellingham"],
    phone: "",
    website: "https://www.watertectonics.com",
    city: "Everett",
    state: "WA",
  },
  {
    name: "SWAT Environmental",
    email: "info@swat-radon.com",
    company: "SWAT Environmental",
    description: "Largest and most experienced radon mitigation services company in the United States. Since 1988, has installed hundreds of thousands of mitigation systems nationwide. All technicians trained following EPA, AARST, and NRPP standards. Services homes and businesses across Oregon and Washington.",
    services: [
      "Air Quality / Emissions",
      "Environmental Site Assessments",
    ],
    certifications: [],
    serviceArea: ["Portland Metro", "Southwest Washington", "Oregon Coast"],
    phone: "1-800-667-2366",
    website: "https://swat-radon.com",
    city: "Portland",
    state: "OR",
  },
  {
    name: "Bravo Environmental",
    email: "info@bravoenvironmental.com",
    company: "Bravo Environmental NW, Inc.",
    description: "Locally owned business operating since 1996, founded by two commercial fishermen who saw declining marine habitat health in Puget Sound. Operates the largest and best equipped fleet of Vactor trucks, tankers, and CCTV inspection units in the region. Equipment and staff mobilize anywhere in Washington or Oregon.",
    services: [
      "Stormwater Management (ISGP/CSGP)",
      "Wastewater Management",
      "Emergency Response / HAZMAT",
    ],
    certifications: [],
    serviceArea: ["Seattle Metro", "Tacoma / South Sound", "Portland Metro", "Olympia / Thurston County"],
    phone: "(425) 424-9000",
    website: "https://www.bravoenvironmental.com",
    city: "Tukwila",
    state: "WA",
  },
];

export const seedVendors = mutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    for (const vendor of VENDORS) {
      // Check if user already exists by email-based clerkId
      const clerkId = `seed_${vendor.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .unique();

      let userId;
      if (existingUser) {
        userId = existingUser._id;
        results.push(`Skipped user: ${vendor.name} (already exists)`);
      } else {
        userId = await ctx.db.insert("users", {
          clerkId,
          email: vendor.email,
          name: vendor.name,
          role: "vendor" as const,
          company: vendor.company,
          createdAt: Date.now(),
        });
        results.push(`Created user: ${vendor.name}`);
      }

      // Check if vendor profile already exists
      const existingProfile = await ctx.db
        .query("vendorProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existingProfile) {
        results.push(`Skipped profile: ${vendor.name} (already exists)`);
        continue;
      }

      await ctx.db.insert("vendorProfiles", {
        userId,
        companyName: vendor.company,
        description: vendor.description,
        services: vendor.services,
        certifications: vendor.certifications,
        serviceArea: vendor.serviceArea,
        phone: vendor.phone || undefined,
        email: vendor.email,
        website: vendor.website || undefined,
        city: vendor.city,
        state: vendor.state,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.push(`Created profile: ${vendor.name}`);
    }

    return results;
  },
});

export const clearSeedVendors = mutation({
  args: {},
  handler: async (ctx) => {
    const seedUsers = await ctx.db.query("users").collect();
    const cleared: string[] = [];

    for (const user of seedUsers) {
      if (user.clerkId.startsWith("seed_")) {
        // Delete vendor profile
        const profile = await ctx.db
          .query("vendorProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .unique();
        if (profile) {
          await ctx.db.delete(profile._id);
          cleared.push(`Deleted profile: ${user.name}`);
        }
        // Delete user
        await ctx.db.delete(user._id);
        cleared.push(`Deleted user: ${user.name}`);
      }
    }

    return cleared;
  },
});
