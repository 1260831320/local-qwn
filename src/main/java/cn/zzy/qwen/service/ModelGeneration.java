package cn.zzy.qwen.service;

public record ModelGeneration(ResolvedModelSelection selection, String response, boolean fallbackUsed) {

    public String backend() {
        return selection.backend();
    }

    public String model() {
        return selection.model();
    }

    public String modelProfile() {
        return selection.modelProfile();
    }

    public String selectionMode() {
        return selection.selectionMode();
    }

    public String selectionReason() {
        return selection.selectionReason();
    }
}
