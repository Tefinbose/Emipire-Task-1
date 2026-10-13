const express = require("express");
const router = express.Router();

const {
  getMarketingSummary,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  toggleCampaignStatus,
  triggerCampaign,
  deleteCampaign,
  getAutomations,
  toggleAutomationStatus,
  updateAutomation,
} = require("../controllers/marketingController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// All marketing management endpoints require Admin authentication
router.use(verifyToken, requireAdmin);

// Marketing Performance Overview & Aggregations
router.get("/summary", getMarketingSummary);

// Marketing Campaigns CRUD & Triggers
router.get("/campaigns", getCampaigns);
router.post("/campaigns", createCampaign);
router.get("/campaigns/:id", getCampaignById);
router.put("/campaigns/:id", updateCampaign);
router.patch("/campaigns/:id/status", toggleCampaignStatus);
router.post("/campaigns/:id/trigger", triggerCampaign);
router.delete("/campaigns/:id", deleteCampaign);

// Marketing Automations (Shopify Flows)
router.get("/automations", getAutomations);
router.patch("/automations/:id/toggle", toggleAutomationStatus);
router.put("/automations/:id", updateAutomation);

module.exports = router;
