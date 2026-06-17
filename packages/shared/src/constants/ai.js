"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_AI_MODEL = exports.DEFAULT_AI_PROVIDER = exports.AI_MODEL_OPTIONS = void 0;
exports.AI_MODEL_OPTIONS = [
    {
        provider: "Claude",
        model: "claude-sonnet-4-6",
        displayName: "Claude Sonnet 4.6 (Recommended)",
        recommendedFor: ["research", "drafts", "analysis"],
        supportsJson: true,
        maxTokens: 200_000,
    },
    {
        provider: "Claude",
        model: "claude-opus-4-7",
        displayName: "Claude Opus 4.7 (Most capable)",
        recommendedFor: ["complex reasoning", "long-form"],
        supportsJson: true,
        maxTokens: 200_000,
    },
    {
        provider: "Claude",
        model: "claude-haiku-4-5-20251001",
        displayName: "Claude Haiku 4.5 (Fast)",
        recommendedFor: ["fast drafts", "summaries", "classification"],
        supportsJson: true,
        maxTokens: 200_000,
    },
];
exports.DEFAULT_AI_PROVIDER = "Claude";
exports.DEFAULT_AI_MODEL = "claude-sonnet-4-6";
