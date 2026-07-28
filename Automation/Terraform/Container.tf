variable "user_id"         {}
variable "container_name"  {}
variable "container_image" {}
variable "internal_port"   {}
variable "external_port"   {}
variable "cpu_shares"      {}
variable "memory"          {}

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.2.0"
    }
  }
}

provider "docker" {
  host = "ssh://<USER>@<HYPervisor_IP>"
}

resource "docker_image" "app" {
  name         = var.container_image
  keep_locally = true
}

resource "docker_container" "app" {
  name       = var.container_name
  image      = docker_image.app.image_id
  cpu_shares = var.cpu_shares
  memory     = var.memory

  ports {
    internal = var.internal_port
    external = var.external_port
  }

  labels {
    label = "user_id"
    value = var.user_id
  }
}

output "container_id" {
  value = docker_container.app.id
}