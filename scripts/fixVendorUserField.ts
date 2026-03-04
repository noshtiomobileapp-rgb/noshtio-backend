import mongoose from "mongoose";

// Define a minimal Vendor schema inline
const VendorSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  user: mongoose.Schema.Types.ObjectId
});

const Vendor = mongoose.model("Vendor", VendorSchema);

async function fixVendorUserField() {
  try {
    // Replace with your actual Atlas connection string
    await mongoose.connect("mongodb+srv://<username>:<password>@cluster0.mongodb.net/noshTio");

    const vendor = await Vendor.findOne({ email: "vendor3@test.com" });

    console.log("Vendor found:", vendor);

    if (vendor) {
      vendor.user = new mongoose.Types.ObjectId("6591222b3b45b05eaec081b");
      await vendor.save();
      console.log("✅ Vendor user field updated to ObjectId");
    } else {
      console.log("❌ Vendor not found");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating vendor:", err);
  }
}

fixVendorUserField();
