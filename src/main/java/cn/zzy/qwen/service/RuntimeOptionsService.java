package cn.zzy.qwen.service;

import cn.zzy.qwen.config.BackendProperties;
import cn.zzy.qwen.config.MachineProperties;
import cn.zzy.qwen.model.RuntimeOptionsResponse;
import org.springframework.stereotype.Service;

@Service
public class RuntimeOptionsService {

    private final MachineProperties machineProperties;
    private final BackendProperties backendProperties;
    private final ModelSelectionService modelSelectionService;

    public RuntimeOptionsService(
            MachineProperties machineProperties,
            BackendProperties backendProperties,
            ModelSelectionService modelSelectionService
    ) {
        this.machineProperties = machineProperties;
        this.backendProperties = backendProperties;
        this.modelSelectionService = modelSelectionService;
    }

    public RuntimeOptionsResponse runtimeOptions() {
        return new RuntimeOptionsResponse(
                machineProperties.profile(),
                normalizeNullable(backendProperties.type()),
                normalizeNullable(backendProperties.fallbackType()),
                modelSelectionService.autoCodeProfile(),
                modelSelectionService.autoGeneralProfile(),
                modelSelectionService.defaultProfilesByBackend(),
                modelSelectionService.availableBackends(),
                modelSelectionService.modelProfiles()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }
}
