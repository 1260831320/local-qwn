package cn.zzy.qwen.service;

import cn.zzy.qwen.model.DocsResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectDocsServiceTest {

    private final ProjectDocsService projectDocsService = new ProjectDocsService();

    @Test
    void returnsReadableChineseDocsTitle() {
        DocsResponse response = projectDocsService.readme("zh");

        assertThat(response.language()).isEqualTo("zh");
        assertThat(response.title()).isEqualTo("项目说明");
        assertThat(response.content()).isNotBlank();
    }
}
