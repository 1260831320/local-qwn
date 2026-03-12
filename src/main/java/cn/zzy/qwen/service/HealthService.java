package cn.zzy.qwen.service;

import cn.zzy.qwen.config.MachineProperties;
import cn.zzy.qwen.model.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    private final ModelBackendRouter modelBackendRouter;
    private final MachineProperties machineProperties;

    public HealthService(ModelBackendRouter modelBackendRouter, MachineProperties machineProperties) {
        this.modelBackendRouter = modelBackendRouter;
        this.machineProperties = machineProperties;
    }

    public HealthResponse health() {
        BackendHealthReport report = modelBackendRouter.healthReport();
        String primaryStatus = report.statuses().getOrDefault(report.primaryBackend(), "unknown");
        String overallStatus = "up".equals(primaryStatus) ? "healthy" : "degraded";
        return new HealthResponse(
                overallStatus,
                "up",
                report.primaryBackend(),
                report.statuses().getOrDefault("ollama", "disabled"),
                report.statuses().getOrDefault("openvino", "disabled"),
                machineProperties.profile(),
                report.message()
        );
    }
}
