import { Command } from 'cs-cli-1-command';

// helper function for timing
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export class Helper extends Command {
  async run() {
    return this.region
  }
}