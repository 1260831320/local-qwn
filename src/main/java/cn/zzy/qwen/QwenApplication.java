package cn.zzy.qwen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class QwenApplication {

    public static void main(String[] args) {
        SpringApplication.run(QwenApplication.class, args);
    }
}
