import mongoose from "mongoose";

const detailsSchema = new mongoose.Schema({
  heading: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  metaKeywords: [{ type: String }], // array for multiple keywords
  countries: [
    {
      country: String,
      percentage: Number,
    },
  ],
  regions: [
    {
      region: String,
      percentage: Number,
    },
  ],

  // 👥 Company Size Breakdown
  employeeSizeBreakdown: [
    {
      range: String, // "1-50", "51-200"
      percentage: Number,
    },
  ],
  revenueSizeBreakdown: [
    {
      range: String, // "<$10M", "$10M-$50M"
      percentage: Number,
    },
  ],

  // 🛠 Services Offered by MSPs
  servicesOffered: [
    {
      service: String, // "Cloud Services"
      percentage: Number,
    },
  ],

  // ⚙️ Technology Adoption
  technologyAdoption: {
    cloudProviders: [
      {
        provider: String, // AWS, Azure, GCP
        percentage: Number,
      },
    ],
    rmmTools: [String], // ConnectWise, Kaseya, etc.
    securityTools: [String], // SIEM, Endpoint, Firewalls
  },

  // 🧑‍💼 Decision-Makers in MSPs
  decisionMakers: [
    {
      role: String, // CEO, CTO, VP IT
      contacts: Number,
    },
  ],

  // 📈 Benchmark Insights & Trends
  benchmarkInsights: {
    cagr: { type: Number, default: 0 }, // CAGR %
    hiringTrends: { type: Number, default: 0 }, // % hiring
    regionalGrowth: [String], // "North America", "Europe"
    acquisitions: { type: Number, default: 0 }, // M&A count
    cloudShift: { type: Number, default: 0 }, // % hybrid/multi-cloud
  },

});

const subcategorySchema = new mongoose.Schema({
  name: { type: String },
  slug: { type: String, unique: true },
  description: { type: String, default: "" },
  content: { type: String, default: "" }, // Add content field for rich text content
  totalCompanies: { type: Number }, // Changed from String to Number
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  companies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "companyTeam",
    },
  ],
  details: detailsSchema,
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;